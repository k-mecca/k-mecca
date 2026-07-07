from fastapi import FastAPI, Form, HTTPException, UploadFile, File

from augmentation import build_augmented_set
from db import get_connection
from engines import get_engine

app = FastAPI()
engine = get_engine()


@app.get("/health")
def health():
    return {"status": "ok"}


# backend-node만 호출하는 내부 전용 API. 사진 여러 장을 한 번에 받아서:
#   1) 사진마다 약한 증강(store용)/강한 증강(upload용) 세트를 만들고
#   2) 각 이미지를 CLIP으로 벡터화하고
#   3) vectors 테이블에 저장한다 (원본만 s3_path를 채움, 증강본은 저장 안 된 임시 이미지라 null)
# 사진 전체를 하나의 트랜잭션으로 묶어서, 중간에 하나라도 실패하면 전부 롤백한다.
@app.post("/embed-and-store")
async def embed_and_store(
    barcode: str = Form(...),
    s3_paths: list[str] = Form(...),
    files: list[UploadFile] = File(...),
):
    if len(files) != len(s3_paths):
        # zip()은 길이가 다르면 짧은 쪽 기준으로 조용히 끝나버려서, 개수가
        # 안 맞는 요청을 여기서 명시적으로 막아 잘못된 부분 처리를 방지한다.
        raise HTTPException(
            status_code=400, detail="files와 s3_paths 개수가 다릅니다."
        )

    conn = get_connection()
    cur = conn.cursor()
    stored = {"store": 0, "upload": 0}

    try:
        for file, s3_path in zip(files, s3_paths):
            image_bytes = await file.read()
            augmented = build_augmented_set(image_bytes)

            for index_type, images in augmented.items():
                for i, image in enumerate(images):
                    is_augmented = i > 0  # 0번째는 항상 원본
                    embedding = engine.embed_image(image)
                    cur.execute(
                        """INSERT INTO vectors (barcode, index_type, is_augmented, s3_path, embedding)
                           VALUES (%s, %s, %s, %s, %s)""",
                        (barcode, index_type, is_augmented, s3_path if not is_augmented else None, embedding),
                    )
                    stored[index_type] += 1
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    return {"stored": stored}
