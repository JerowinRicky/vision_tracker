import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
from .similarity import cosine_similarity, classify_match_confidence


class AppearanceMatcher:
    def __init__(self, threshold: float = 0.85, max_candidates: int = 5):
        self.threshold = threshold
        self.max_candidates = max_candidates

    def find_matches(
        self,
        query_embedding: np.ndarray,
        gallery: List[Dict[str, Any]],
        class_name: Optional[str] = None,
        lookback_minutes: Optional[int] = None,
        cross_camera_only: bool = False,
        source_camera_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Compares query embedding with persistent object gallery.
        Returns sorted list of candidate matches above threshold.
        """
        candidates = []
        now = datetime.now(timezone.utc)

        for item in gallery:
            # Class filter
            if class_name and item.get("class_name") != class_name:
                continue

            # Cross-camera filter if requested
            if cross_camera_only and source_camera_id:
                if item.get("last_camera_id") == source_camera_id:
                    continue

            # Lookback window filter
            if lookback_minutes and "last_seen" in item:
                try:
                    last_seen_dt = item["last_seen"]
                    if isinstance(last_seen_dt, str):
                        last_seen_dt = datetime.fromisoformat(last_seen_dt.replace("Z", "+00:00"))
                    diff_minutes = (now - last_seen_dt).total_seconds() / 60.0
                    if diff_minutes > lookback_minutes:
                        continue
                except Exception:
                    pass

            target_emb = item.get("embedding")
            if target_emb is not None:
                sim = cosine_similarity(query_embedding, target_emb)
                is_match, label = classify_match_confidence(sim, self.threshold)

                if is_match:
                    candidates.append({
                        "persistent_id": item.get("persistent_id"),
                        "class_name": item.get("class_name"),
                        "similarity_score": round(sim, 4),
                        "match_label": label,
                        "last_camera_id": item.get("last_camera_id"),
                        "last_seen": item.get("last_seen"),
                    })

        # Sort descending by similarity
        candidates.sort(key=lambda x: x["similarity_score"], reverse=True)
        return candidates[:self.max_candidates]


# Alias
EmbeddingMatcher = AppearanceMatcher

