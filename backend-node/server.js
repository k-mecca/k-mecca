require("dotenv").config({ quiet: true });
const express = require("express");
const multer = require("multer");
const { pool } = require("./db");
const { parseExcelBuffer } = require("./excelImport");

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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
             sale_price, current_stock, safety_stock, stock_status, unit, note, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, now())
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
             updated_at = now()`,
          [
            p.barcode, p.name, p.product_group, p.category, p.supplier,
            p.purchase_price, p.sale_price, p.current_stock, p.safety_stock,
            p.stock_status, p.unit, p.note,
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

// multer 에러(파일 크기 초과 등)를 JSON으로 정리해서 응답
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: "파일 업로드 오류: " + err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "서버 오류가 발생했습니다." });
});

app.listen(PORT, () => {
  console.log(`backend-node 포트열림 ${PORT}`);
});
