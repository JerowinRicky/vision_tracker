from abc import ABC, abstractmethod
import numpy as np
from typing import List, Dict, Any, Optional, Tuple


class BaseReIdentifier(ABC):
    """
    Abstract base class for appearance Re-Identification models.
    Decouples underlying deep learning / computer vision models from the analytics pipeline.
    """

    @abstractmethod
    def extract_embedding(self, image: np.ndarray) -> np.ndarray:
        """Extracts fixed-dimensional unit-normalized visual appearance vector."""
        pass

    @abstractmethod
    def compare(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """Returns similarity score between 0.0 and 1.0."""
        pass

    @abstractmethod
    def find_matches(
        self,
        query_embedding: np.ndarray,
        gallery: List[Dict[str, Any]],
        top_k: int = 5,
        class_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Searches gallery and returns ranked candidate matches."""
        pass
