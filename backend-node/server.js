require("dotenv").config({ quiet: true });
const express = require("express");
const multer = require("multer");
const { pool } = require("./db");
const { parseExcelBuffer } = require("./excelImport");
const { uploadRawImage, deleteRawImage } = require("./s3");

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || "http://127.0.0.1:8000";
// top-1 유사도가 이 값 이상이면 "확신 있음"으로 분류 (잠정치, PoC 후 조정 예정)
const rawThreshold = Number(process.env.CONFIDENCE_THRESHOLD ?? 0.3);
const CONFIDENCE_THRESHOLD = Number.isFinite(rawThreshold) ? rawThreshold : 0.3;

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      return cb(new Error("jpeg/png/webp 형식의 이미지만 업로드 가능합니다."));
    }
    cb(null, true);
  },
});

// 로컬 개발 중 프론트(3000)와, 모바일 실기기 테스트용 ngrok 터널에서
// 백엔드로 호출할수있게 허용해놓고
const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "https://object-poppy-vendetta.ngrok-free.dev",
]);
app.use((req, res, next) => {
  if (ALLOWED_ORIGINS.has(req.headers.origin)) {
    res.header("Access-Control-Allow-Origin", req.headers.origin);
  }
  res.header("Access-Control-Allow-Methods", "GET,POST");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// 헬스체크
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// 바코드 조회
app.get("/api/products/lookup", async (req, res) => {
  const barcode = String(req.query.barcode ?? "").trim();
  if (barcode === "" || barcode.length > 64) {
    return res.status(400).json({ error: "barcode 쿼리 파라미터가 필요합니다." });
  }

  try {
    const result = await pool.query(
      "SELECT barcode, name FROM products WHERE barcode = $1",
      [barcode],
    );

    if (result.rows.length === 0) {
      return res.json({ registered: false });
    }

    return res.json({ registered: true, product: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "조회 중 오류가 발생했습니다." });
  }
});

// 관련 상품(동일 아티스트) 조회: 스캔 결과로 얻은 바코드를 그대로 넣으면,
// 그 상품의 artist를 찾아 같은 아티스트의 다른 상품들을 인기순(판매수량 내림차순)으로 반환한다.
app.get("/api/products/:barcode/related", async (req, res) => {
  const barcode = String(req.params.barcode ?? "").trim();

  try {
    const productResult = await pool.query(
      "SELECT artist FROM products WHERE barcode = $1",
      [barcode],
    );
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: "상품마스터에 없는 바코드입니다." });
    }

    const { artist } = productResult.rows[0];
    if (!artist) {
      return res.json({ artist: null, related: [] });
    }

    const relatedResult = await pool.query(
      `SELECT barcode, name, sale_price, current_stock, image_url, sales_count
       FROM products
       WHERE artist = $1 AND barcode != $2
       ORDER BY sales_count DESC NULLS LAST, barcode
       LIMIT 10`,
      [artist, barcode],
    );

    return res.json({
      artist,
      related: relatedResult.rows.map((r) => ({
        barcode: r.barcode,
        name: r.name,
        salePrice: r.sale_price !== null ? Number(r.sale_price) : null,
        currentStock: r.current_stock,
        imageUrl: r.image_url,
        salesCount: r.sales_count,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "관련 상품 조회 중 오류가 발생했습니다." });
  }
});

// 상품 등록: 사진들을 S3에 저장하고, 각각을 ai-engine-python에 전달해서
// 벡터화+DB저장까지 시킨다 (Node는 파일 전달까지만, 벡터 계산/저장은 Python 담당)
app.post("/api/register", imageUpload.array("photos", 5), async (req, res) => {
  const barcode = String(req.body.barcode ?? "").trim();
  if (barcode === "") {
    return res.status(400).json({ error: "barcode가 필요합니다." });
  }
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "photos 필드로 사진을 1장 이상 첨부해주세요." });
  }

  // 엑셀로 이미 등록된 바코드만 사진 등록 가능 (신규 바코드는 허용하지 않음)
  const existing = await pool.query(
    "SELECT barcode FROM products WHERE barcode = $1",
    [barcode],
  );
  if (existing.rows.length === 0) {
    return res.status(404).json({
      error: "상품마스터에 없는 바코드입니다. 엑셀 업로드로 먼저 등록해주세요.",
      registered: false,
    });
  }

  // 1. 사진을 전부 S3에 먼저 업로드하고 경로를 모아둠
  const s3Paths = [];
  try {
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const s3Path = await uploadRawImage(barcode, i + 1, file.buffer, file.mimetype);
      s3Paths.push(s3Path);
    }

    // 2. ai-engine-python에는 사진 전체를 딱 한 번에 전달 → 그쪽에서 하나의
    //    트랜잭션으로 처리하게 해서, 사진 하나가 실패하면 전부 롤백되게 함
    const form = new FormData();
    form.append("barcode", barcode);
    for (const s3Path of s3Paths) {
      form.append("s3_paths", s3Path);
    }
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      form.append("files", new Blob([file.buffer], { type: file.mimetype }), `${i + 1}.jpg`);
    }

    const response = await fetch(`${AI_ENGINE_URL}/embed-and-store`, {
      method: "POST",
      body: form,
    });
    if (!response.ok) {
      throw new Error(`ai-engine-python 응답 오류 (${response.status})`);
    }
    const data = await response.json();

    return res.json({ barcode, photos: req.files.length, stored: data.stored });
  } catch (err) {
    console.error(err);
    // DB 트랜잭션은 Python 쪽에서 롤백되지만, 이미 올라간 S3 파일은 남아있으니
    // 여기서 직접 지워서 "DB엔 없는데 S3엔 있는" 고아 파일을 방지한다.
    await Promise.all(
      s3Paths.map((key) => deleteRawImage(key).catch((e) => console.error("S3 정리 실패:", e))),
    );
    return res.status(500).json({ error: "등록 처리 중 오류가 발생했습니다." });
  }
});

// 인식: 매장 내(store) 인식과 업로드 확인(upload)이 검색 로직은 완전히 같고
// mode(=index_type)만 다르다. 실제 벡터 검색/CLIP 계산은 ai-engine-python이 하고,
// 여기서는 top-1 점수로 "확신 있음/없음"만 판단해서 안내문구를 붙여 응답한다.
app.post("/api/scan", imageUpload.single("photo"), async (req, res) => {
  const mode = req.query.mode;
  if (mode !== "store" && mode !== "upload") {
    return res.status(400).json({ error: "mode 쿼리 파라미터는 store 또는 upload여야 합니다." });
  }
  if (!req.file) {
    return res.status(400).json({ error: "photo 필드로 사진을 첨부해주세요." });
  }

  try {
    const form = new FormData();
    form.append("index_type", mode);
    form.append("file", new Blob([req.file.buffer], { type: req.file.mimetype }), "query.jpg");

    const response = await fetch(`${AI_ENGINE_URL}/search`, { method: "POST", body: form });
    if (!response.ok) {
      throw new Error(`ai-engine-python 응답 오류 (${response.status})`);
    }
    const data = await response.json();
    const candidates = Array.isArray(data.candidates) ? data.candidates : [];

    const isConfident = candidates.length > 0 && candidates[0].score >= CONFIDENCE_THRESHOLD;

    if (isConfident) {
      return res.json({ isConfident: true, candidates });
    }

    if (mode === "store") {
      return res.json({
        isConfident: false,
        candidates,
        guidance: {
          type: "barcode",
          message: "정확히 인식하지 못했습니다. 상품에 붙은 바코드를 비춰주세요.",
        },
      });
    }

    // mode === "upload" — 외부(Lens API) 참고 정보는 채택하지 않기로 결정, 직원 문의 안내만 반환
    return res.json({
      isConfident: false,
      candidates,
      guidance: {
        type: "staff",
        message: "정확한 재고/가격은 매장 직원에게 문의해주세요.",
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "인식 처리 중 오류가 발생했습니다." });
  }
});

// 엑셀 업로드 → 상품마스터 upsert (파일 전체를 하나의 트랜잭션으로 처리)
app.post(
  "/api/products/import",
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "file 필드로 엑셀 파일을 첨부해주세요." });
    }

    let products, skipped;
    try {
      ({ products, skipped } = parseExcelBuffer(req.file.buffer));
    } catch (err) {
      console.error(err);
      return res.status(400).json({ error: "엑셀 파일을 읽을 수 없습니다." });
    }

    const client = await pool.connect();
    let imported = 0;
    try {
      await client.query("BEGIN");

      for (const p of products) {
        if (!p.name) {
          skipped += 1;
          continue;
        }
        await client.query(
          `INSERT INTO products
            (barcode, name, product_group, category, supplier, purchase_price,
             sale_price, current_stock, safety_stock, stock_status, unit, note, image_url, sales_count, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now())
           ON CONFLICT (barcode) DO UPDATE SET
             name = COALESCE(EXCLUDED.name, products.name),
             product_group = COALESCE(EXCLUDED.product_group, products.product_group),
             category = COALESCE(EXCLUDED.category, products.category),
             supplier = COALESCE(EXCLUDED.supplier, products.supplier),
             purchase_price = COALESCE(EXCLUDED.purchase_price, products.purchase_price),
             sale_price = COALESCE(EXCLUDED.sale_price, products.sale_price),
             current_stock = COALESCE(EXCLUDED.current_stock, products.current_stock),
             safety_stock = COALESCE(EXCLUDED.safety_stock, products.safety_stock),
             stock_status = COALESCE(EXCLUDED.stock_status, products.stock_status),
             unit = COALESCE(EXCLUDED.unit, products.unit),
             note = COALESCE(EXCLUDED.note, products.note),
             image_url = COALESCE(EXCLUDED.image_url, products.image_url),
             sales_count = COALESCE(EXCLUDED.sales_count, products.sales_count),
             updated_at = now()`,
          [
            p.barcode, p.name, p.product_group, p.category, p.supplier,
            p.purchase_price, p.sale_price, p.current_stock, p.safety_stock,
            p.stock_status, p.unit, p.note, p.image_url, p.sales_count,
          ],
        );
        imported += 1;
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err);
      return res.status(500).json({
        error: "엑셀 반영 중 오류가 발생해 전체 롤백되었습니다. 반영된 내용이 없습니다.",
      });
    } finally {
      client.release();
    }

    return res.json({ imported, skipped });
  },
);

// multer 에러(파일 크기 초과, fileFilter 거부 등)를 JSON으로 정리해서 응답
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || /이미지만 업로드 가능/.test(err.message)) {
    return res.status(400).json({ error: "파일 업로드 오류: " + err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "서버 오류가 발생했습니다." });
});

app.listen(PORT, () => {
  console.log(`backend-node 포트열림 ${PORT}`);
});
