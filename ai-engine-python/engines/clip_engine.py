from sentence_transformers import SentenceTransformer

from .base import EmbeddingEngine

# EC2가 GPU 없는 CPU 인스턴스라 clip-ViT-B-32(가벼운 버전) 사용
# 정확도가 부족해지면 clip-ViT-L-14로 교체 (이 인터페이스만 지키면 됨)
MODEL_NAME = "clip-ViT-B-32"


class ClipEngine(EmbeddingEngine):
    def __init__(self):
        self.model = SentenceTransformer(MODEL_NAME)

    def embed_image(self, image):
        # pgvector 인덱스가 cosine distance(vector_cosine_ops) 기준이라
        # 정규화된 벡터로 저장/비교하도록 명시 (정규화 안 해도 코사인 유사도
        # 자체는 수학적으로 같지만, 나중에 내적(inner product) 등 다른
        # 거리 연산으로 바꿀 때 조용히 틀어지는 걸 방지하기 위해 명시적으로 고정)
        embedding = self.model.encode(image, normalize_embeddings=True)
        return embedding.tolist()
