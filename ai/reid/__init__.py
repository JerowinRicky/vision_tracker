from .base import BaseReIdentifier
from .similarity import cosine_similarity, classify_match_confidence
from .extractor import AppearanceExtractor
from .matcher import AppearanceMatcher
from .service import ReIDService

# Backwards compatibility alias
ReIDEngine = ReIDService

__all__ = [
    'BaseReIdentifier',
    'ReIDService',
    'ReIDEngine',
    'AppearanceExtractor',
    'AppearanceMatcher',
    'cosine_similarity',
    'classify_match_confidence',
]
