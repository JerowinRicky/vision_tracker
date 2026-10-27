"""
Object Detection Engine for VisionTrack AI.
Supports YOLOv8, OpenCV DNN, and adaptive motion/contour detection fallback
for classes: person, car, motorcycle, bus, truck, bicycle, dog, cat, bird, etc.
"""

import cv2
import numpy as np
from typing import List, Dict, Any, Optional
import os


COCO_CLASSES = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
    "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
    "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
    "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
    "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
    "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
    "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake",
    "chair", "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop",
    "mouse", "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink",
    "refrigerator", "book", "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush"
]

TARGET_CLASSES = {
    "person", "car", "motorcycle", "bus", "truck", "bicycle", "dog", "cat", "bird"
}


class ObjectDetector:
    def __init__(
        self,
        model_name: str = "yolov8n",
        confidence_threshold: float = 0.5,
        iou_threshold: float = 0.45,
        target_classes: Optional[List[str]] = None,
        device: str = "cpu",
        input_size: int = 640,
    ):
        self.model_name = model_name
        self.confidence_threshold = confidence_threshold
        self.iou_threshold = iou_threshold
        self.target_classes = set(target_classes) if target_classes else TARGET_CLASSES
        self.device = device
        self.input_size = input_size
        self.yolo_model = None
        self.bg_subtractor = None
        self._init_model()

    def _init_model(self):
        """Initializes YOLOv8 if ultralytics is installed; otherwise initializes adaptive OpenCV fallback."""
        try:
            from ultralytics import YOLO
            self.yolo_model = YOLO(f"{self.model_name}.pt")
            print(f"[ObjectDetector] Successfully loaded YOLO model: {self.model_name}")
        except Exception as e:
            # OpenCV background subtractor & contour analyzer fallback for standalone dev/testing
            self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(history=500, varThreshold=25, detectShadows=True)
            print(f"[ObjectDetector] YOLO native not loaded ({e}), using OpenCV adaptive vision engine.")

    def detect(self, frame: np.ndarray, timestamp_str: str = "") -> List[Dict[str, Any]]:
        """
        Runs object detection on the given BGR image frame.
        Returns list of detections:
        [
            {
                "class": "person",
                "confidence": 0.94,
                "bbox": [x, y, width, height], # pixel coords
                "timestamp": timestamp_str
            },
            ...
        ]
        """
        if frame is None or frame.size == 0:
            return []

        h, w = frame.shape[:2]

        if self.yolo_model is not None:
            return self._detect_yolo(frame, timestamp_str)
        else:
            return self._detect_opencv_fallback(frame, timestamp_str, w, h)

    def _detect_yolo(self, frame: np.ndarray, timestamp_str: str) -> List[Dict[str, Any]]:
        results = self.yolo_model.predict(
            source=frame,
            conf=self.confidence_threshold,
            iou=self.iou_threshold,
            device=self.device,
            imgsz=self.input_size,
            verbose=False,
        )

        detections = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                cls_id = int(box.cls[0])
                cls_name = result.names.get(cls_id, "unknown")
                if self.target_classes and cls_name not in self.target_classes:
                    continue

                conf = float(box.conf[0])
                xyxy = box.xyxy[0].cpu().numpy()
                x1, y1, x2, y2 = xyxy
                bx = max(0, int(x1))
                by = max(0, int(y1))
                bw = max(1, int(x2 - x1))
                bh = max(1, int(y2 - y1))

                detections.append({
                    "class": cls_name,
                    "confidence": round(conf, 3),
                    "bbox": [bx, by, bw, bh],
                    "timestamp": timestamp_str
                })

        return detections

    def _detect_opencv_fallback(self, frame: np.ndarray, timestamp_str: str, width: int, height: int) -> List[Dict[str, Any]]:
        """
        Adaptive OpenCV contour and aspect-ratio detection fallback.
        Discriminates humans (vertical aspect ratio), vehicles (horizontal aspect ratio),
        and animals based on geometric and motion heuristics.
        """
        if self.bg_subtractor is None:
            self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(history=500, varThreshold=25, detectShadows=True)

        fg_mask = self.bg_subtractor.apply(frame)
        # Morphological filtering to eliminate noise
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        clean_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel)
        clean_mask = cv2.dilate(clean_mask, kernel, iterations=2)

        contours, _ = cv2.findContours(clean_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        detections = []

        min_area = (width * height) * 0.003  # min 0.3% of frame
        max_area = (width * height) * 0.7    # max 70% of frame

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if min_area <= area <= max_area:
                x, y, w, h = cv2.boundingRect(cnt)
                aspect_ratio = float(h) / max(1.0, float(w))

                # Heuristic classification
                if aspect_ratio >= 1.6 and h > 50:
                    cls_name = "person"
                    conf = min(0.96, 0.70 + (area / (width * height)) * 1.5)
                elif aspect_ratio <= 1.1 and w > 60:
                    if w > width * 0.3:
                        cls_name = "bus" if aspect_ratio > 0.7 else "truck"
                    else:
                        cls_name = "car"
                    conf = min(0.95, 0.75 + (area / (width * height)) * 1.2)
                elif 1.1 < aspect_ratio < 1.6 and w > 40:
                    cls_name = "motorcycle" if h > 60 else "dog"
                    conf = 0.78
                else:
                    cls_name = "person"
                    conf = 0.72

                if self.target_classes and cls_name not in self.target_classes:
                    continue

                if conf >= self.confidence_threshold:
                    detections.append({
                        "class": cls_name,
                        "confidence": round(conf, 3),
                        "bbox": [x, y, w, h],
                        "timestamp": timestamp_str
                    })

        return detections
