from sentence_transformers import SentenceTransformer

from .base import EmbeddingEngine

# EC2가 GPU 없는 CPU 인스턴스라 clip-ViT-B-32(가벼운 버전) 사용
# 정확도가 부족해지면 clip-ViT-L-14로 교체 (이 인터페이스만 지키면 됨)
MODEL_NAME = "clip-ViT-B-32"


class ClipEngine(EmbeddingEngine):
    def __init__(self):
        self.model = SentenceTransformer(MODEL_NAME)

    def embed_image(self, image):
        embedding = self.model.encode(image)
        return embedding.tolist()
