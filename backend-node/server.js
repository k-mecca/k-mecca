require("dotenv").config({ quiet: true });
const express = require("express");
const { pool } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

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

app.listen(PORT, () => {
  console.log(`backend-node 포트열림 ${PORT}`);
});
