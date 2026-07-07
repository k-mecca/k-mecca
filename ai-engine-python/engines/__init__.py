from .clip_engine import ClipEngine


def get_engine():
    """엔진 팩토리 — 나중에 여러 엔진 교체가능."""
    return ClipEngine()
