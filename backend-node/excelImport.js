const XLSX = require("xlsx");

// 케이메카 엑셀은 재고현황 / 매출데이터(상품별) 두 포맷이 있고 컬럼이 다르다.
// 포맷 판별은 시트 헤더 한 번만 보고 정한다 (행마다 다시 판별하면, 특정 행에서
// 매입단가 셀이 비어있을 때 그 행만 다른 포맷으로 잘못 인식되는 문제가 생김).
function mapRow(row, barcodeText, isSalesFormat) {
  const barcode = String(barcodeText ?? "").trim();
  if (barcode === "") return null;

  if (isSalesFormat) {
    return {
      barcode,
      name: row["상품"] ?? null,
      product_group: row["상품그룹"] ?? null,
      category: row["상품분류"] ?? null,
      supplier: row["주매입처"] ?? null, // 재고현황의 "매입처"와 같은 개념으로 취급
      purchase_price: row["매입단가"] ?? null,
      sale_price: row["판매단가"] ?? null,
      current_stock: row["현재고"] ?? null,
      safety_stock: null,
      stock_status: null,
      unit: null,
      note: null,
      image_url: row["대표이미지"] ?? null,
    };
  }

  return {
    barcode,
    name: row["상품"] ?? null,
    product_group: null,
    category: null,
    supplier: row["매입처"] ?? null,
    purchase_price: null,
    sale_price: null,
    current_stock: row["현재고"] ?? null,
    safety_stock: row["안전재고"] ?? null,
    stock_status: row["재고상태"] ?? null,
    unit: row["재고 단위"] ?? null,
    note: row["비고"] ?? null,
    image_url: row["대표이미지"] ?? null,
  };
}

function parseExcelBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // 헤더 행만 먼저 읽어서 포맷을 한 번만 판별
  const [headerRow = []] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const isSalesFormat = headerRow.includes("매입단가");

  // 기본 파싱: 숫자 컬럼(매입단가 등)은 콤마 없는 순수 숫자로 유지
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: null });

  // 바코드만 별도로 화면에 보이는 문자열 그대로 다시 읽음 (raw:false)
  // → 바코드가 숫자 셀이어도 앞자리 0이 사라지지 않게 하기 위함
  //   raw:false를 전체에 적용하면 매입단가 같은 숫자에 "6,400"처럼 콤마가
  //    붙어버려서 DB numeric 타입 저장이 깨지기때문에 바코드 컬럼에만 한정해서 적용
  const textRows = XLSX.utils.sheet_to_json(sheet, {
    defval: null,
    raw: false,
  });

  const products = [];
  let skipped = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const mapped = mapRow(rawRows[i], textRows[i]["바코드"], isSalesFormat);
    if (mapped === null) {
      skipped += 1;
      continue;
    }
    products.push(mapped);
  }

  return { products, skipped };
}

module.exports = { parseExcelBuffer };
