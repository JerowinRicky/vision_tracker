import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from .base import BaseReIdentifier
from .extractor import AppearanceExtractor
from .matcher import AppearanceMatcher
from .similarity import cosine_similarity, classify_match_confidence


class ReIDService(BaseReIdentifier):
    def __init__(
        self,
        similarity_threshold: float = 0.85,
        embedding_dim: int = 128,
        max_candidates: int = 5,
        model_version: str = "vtrack-reid-appearance-v2"
    ):
        self.similarity_threshold = similarity_threshold
        self.embedding_dim = embedding_dim
        self.model_version = model_version
        self.extractor = AppearanceExtractor(embedding_dim=embedding_dim)
        self.matcher = AppearanceMatcher(threshold=similarity_threshold, max_candidates=max_candidates)

    def extract_embedding(self, image: np.ndarray) -> np.ndarray:
        return self.extractor.extract(image)

    def compare(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        return cosine_similarity(embedding1, embedding2)

    def compute_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        return cosine_similarity(embedding1, embedding2)

    def find_matches(
        self,
        query_embedding: np.ndarray,
        gallery: List[Dict[str, Any]],
        top_k: int = 5,
        class_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        self.matcher.max_candidates = top_k
        return self.matcher.find_matches(query_embedding, gallery, class_name=class_name)

    def match_best(
        self,
        query_embedding: np.ndarray,
        gallery: List[Dict[str, Any]],
        class_name: Optional[str] = None,
        source_camera_id: Optional[str] = None
    ) -> Tuple[Optional[str], float, str]:
        """
        Returns (matched_persistent_id, highest_similarity, match_label).
        Compatible with previous ReIDEngine interface while leveraging full Phase 2 architecture.
        """
        matches = self.matcher.find_matches(
            query_embedding,
            gallery,
            class_name=class_name,
            source_camera_id=source_camera_id
        )

        if matches:
            top = matches[0]
            return top["persistent_id"], top["similarity_score"], top["match_label"]

        return None, 0.0, "Unmatched"
