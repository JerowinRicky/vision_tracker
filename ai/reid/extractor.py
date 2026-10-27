import cv2
import numpy as np


class AppearanceExtractor:
    def __init__(self, embedding_dim: int = 128):
        self.embedding_dim = embedding_dim

    def extract(self, crop_image: np.ndarray) -> np.ndarray:
        """
        Extracts robust, lighting-invariant appearance features from an object image crop.
        Combines spatial color moments (mean/std in RGB & HSV) and multi-scale spatial histograms.
        """
        if crop_image is None or crop_image.size == 0:
            return np.zeros(self.embedding_dim, dtype=np.float32)

        # Standardize crop size
        resized = cv2.resize(crop_image, (64, 128), interpolation=cv2.INTER_AREA)

        # Color transformations
        hsv = cv2.cvtColor(resized, cv2.COLOR_BGR2HSV).astype(np.float32)
        bgr = resized.astype(np.float32)

        h, w, _ = resized.shape
        upper_hsv = hsv[0 : h // 2, :]
        lower_hsv = hsv[h // 2 :, :]
        upper_bgr = bgr[0 : h // 2, :]
        lower_bgr = bgr[h // 2 :, :]

        # Compute continuous color moments (mean, std)
        u_hsv_mean = np.mean(upper_hsv, axis=(0, 1)) / [180.0, 255.0, 255.0]
        u_hsv_std = np.std(upper_hsv, axis=(0, 1)) / [180.0, 255.0, 255.0]
        l_hsv_mean = np.mean(lower_hsv, axis=(0, 1)) / [180.0, 255.0, 255.0]
        l_hsv_std = np.std(lower_hsv, axis=(0, 1)) / [180.0, 255.0, 255.0]

        u_bgr_mean = np.mean(upper_bgr, axis=(0, 1)) / 255.0
        l_bgr_mean = np.mean(lower_bgr, axis=(0, 1)) / 255.0

        color_moments = np.concatenate([
            u_hsv_mean, u_hsv_std, l_hsv_mean, l_hsv_std, u_bgr_mean, l_bgr_mean
        ])

        # Smooth spatial histograms for Hue and Value
        h_hist_u = cv2.calcHist([resized[0 : h // 2, :]], [0], None, [16], [0, 180]).flatten() / float(h * w / 2.0)
        h_hist_l = cv2.calcHist([resized[h // 2 :, :]], [0], None, [16], [0, 180]).flatten() / float(h * w / 2.0)
        v_hist = cv2.calcHist([resized], [2], None, [16], [0, 256]).flatten() / float(h * w)

        raw_feat = np.concatenate([color_moments * 3.0, h_hist_u, h_hist_l, v_hist])

        if len(raw_feat) >= self.embedding_dim:
            embedding = raw_feat[:self.embedding_dim]
        else:
            embedding = np.pad(raw_feat, (0, self.embedding_dim - len(raw_feat)), "constant")

        # L2 normalization to unit sphere
        norm = np.linalg.norm(embedding)
        if norm > 1e-6:
            embedding = embedding / norm

        return embedding.astype(np.float32)


# Alias
FeatureExtractor = AppearanceExtractor

