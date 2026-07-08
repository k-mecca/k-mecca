from db import get_connection


def search_top5(embedding, index_type, limit=5):
    """주어진 벡터와 가장 가까운 상품 top-5를 반환한다.

    상품 하나가 vectors 테이블에 여러 행(원본+증강본)을 갖고 있으므로,
    바코드별로 "제일 잘 맞는 벡터 하나"만 남긴 뒤 그 점수로 다시 정렬해서
    top-5를 뽑는다 (안 그러면 같은 상품이 결과에 중복으로 나올 수 있음).
    """
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT p.barcode, p.name, p.sale_price, p.current_stock, sub.score
            FROM (
                SELECT DISTINCT ON (barcode)
                    barcode,
                    1 - (embedding <=> %s::vector) AS score
                FROM vectors
                WHERE index_type = %s
                ORDER BY barcode, embedding <=> %s::vector
            ) sub
            JOIN products p ON p.barcode = sub.barcode
            ORDER BY sub.score DESC
            LIMIT %s
            """,
            (embedding, index_type, embedding, limit),
        )
        rows = cur.fetchall()
    finally:
        conn.close()

    return [
        {
            "barcode": barcode,
            "name": name,
            "salePrice": float(sale_price) if sale_price is not None else None,
            "currentStock": current_stock,
            "score": float(score),
        }
        for barcode, name, sale_price, current_stock, score in rows
    ]
