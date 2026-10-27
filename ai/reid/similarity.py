import numpy as np
from typing import Tuple


def cosine_similarity(emb1: np.ndarray, emb2: np.ndarray) -> float:
    """Computes cosine similarity between two unit-normalized embedding vectors."""
    if emb1 is None or emb2 is None:
        return 0.0
    dot = float(np.dot(emb1, emb2))
    return max(0.0, min(1.0, dot))


def classify_match_confidence(similarity: float, threshold: float = 0.85) -> Tuple[bool, str]:
    """
    Categorizes similarity according to strict probabilistic security bounds.
    Never states absolute certainty.
    """
    if similarity < threshold:
        return False, "Unmatched"

    if similarity >= 0.95:
        return True, "Strong match"
    elif similarity >= 0.90:
        return True, "Likely match"
    else:
        return True, "Possible match"
