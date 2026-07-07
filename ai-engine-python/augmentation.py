import random
from io import BytesIO

from PIL import Image, ImageEnhance, ImageFilter


def _jitter_brightness_contrast(image, max_delta):
    # max_delta=0.1 -> 밝기/대비를 원본의 90~110% 사이에서 무작위로 조정
    brightness_factor = 1 + random.uniform(-max_delta, max_delta)
    contrast_factor = 1 + random.uniform(-max_delta, max_delta)
    out = ImageEnhance.Brightness(image).enhance(brightness_factor)
    out = ImageEnhance.Contrast(out).enhance(contrast_factor)
    return out


def _random_crop(image, min_ratio=0.9):
    width, height = image.size
    ratio = random.uniform(min_ratio, 1.0)
    crop_w, crop_h = int(width * ratio), int(height * ratio)
    left = random.randint(0, width - crop_w)
    top = random.randint(0, height - crop_h)
    return image.crop((left, top, left + crop_w, top + crop_h))


def augment_weak(image, count=2):
    """store 인덱스용 — 밝기/대비만 소폭 조정 (디자인 구분력 보존)."""
    return [_jitter_brightness_contrast(image, max_delta=0.1) for _ in range(count)]


def augment_strong(image, count=4):
    """upload 인덱스용 — 밝기/대비/블러/회전/크롭을 강하게, 다양한 촬영 환경 커버."""
    results = []
    for _ in range(count):
        out = _jitter_brightness_contrast(image, max_delta=0.2)
        out = out.rotate(random.uniform(-15, 15), expand=False, fillcolor="white")
        out = _random_crop(out, min_ratio=0.9)
        if random.random() < 0.5:
            out = out.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.5, 1.5)))
        results.append(out)
    return results


def build_augmented_set(image_bytes):
    """원본 이미지 바이트를 받아 store/upload 인덱스용 이미지 목록을 만든다.
    반환값의 각 이미지는 원본을 포함한다."""
    original = Image.open(BytesIO(image_bytes)).convert("RGB")

    store_images = [original] + augment_weak(original)
    upload_images = [original] + augment_strong(original)

    return {"store": store_images, "upload": upload_images}
