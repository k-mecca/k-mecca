from abc import ABC, abstractmethod


class EmbeddingEngine(ABC):
    """이미지 → 벡터 변환 엔진의 공통 인터페이스.
    엔진을 교체하더라도(clip-ViT-B-32 → clip-ViT-L-14 등) 이 인터페이스만
    지키면 app.py 쪽 코드는 무수정"""

    @abstractmethod
    def embed_image(self, image):
        """PIL Image를 받아 float 리스트(벡터)를 반환한다."""
        raise NotImplementedError
