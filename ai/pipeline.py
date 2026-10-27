"""
Unified Frame Processing Pipeline for VisionTrack AI.
Coordinates video input, frame skipping, detection, tracking,
ReID, zone analytics, evidence capture, and event generation.
"""

import cv2
import os
import time
import uuid
import numpy as np
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Callable

from .detection.detector import ObjectDetector
from .tracking.tracker import MultiObjectTracker
from .reid.reid_engine import ReIDEngine
from .zones.zone_checker import ZoneAnalyzer


class VideoPipeline:
    def __init__(
        self,
        camera_id: Optional[int] = None,
        camera_name: str = "CAM-01",
        video_id: Optional[int] = None,
        detector: Optional[ObjectDetector] = None,
        tracker: Optional[MultiObjectTracker] = None,
        reid_engine: Optional[ReIDEngine] = None,
        zone_analyzer: Optional[ZoneAnalyzer] = None,
        processing_fps: int = 10,
        evidence_dir: str = "media/evidence",
        event_callback: Optional[Callable[[str, Dict[str, Any]], None]] = None,
    ):
        self.camera_id = camera_id
        self.camera_name = camera_name
        self.video_id = video_id
        self.processing_fps = processing_fps
        self.evidence_dir = evidence_dir
        self.event_callback = event_callback

        os.makedirs(self.evidence_dir, exist_ok=True)

        self.detector = detector or ObjectDetector()
        self.tracker = tracker or MultiObjectTracker()
        self.reid_engine = reid_engine or ReIDEngine()
        self.zone_analyzer = zone_analyzer

        # Gallery of persistent objects for ReID matching
        self.persistent_gallery: List[Dict[str, Any]] = []

        # Internal state tracking
        self.track_evidence_captured: Dict[int, Dict[str, Any]] = {}
        self.persistent_counter = 1

    def set_persistent_gallery(self, gallery: List[Dict[str, Any]]):
        """Sets historical persistent objects gallery for ReID matching."""
        self.persistent_gallery = gallery

    def process_frame(
        self,
        frame: np.ndarray,
        frame_idx: int,
        timestamp_str: Optional[str] = None,
        elapsed_seconds: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Executes a single processing iteration over a frame.
        """
        if timestamp_str is None:
            timestamp_str = datetime.now(timezone.utc).isoformat()

        # Step 1: Detect objects
        raw_detections = self.detector.detect(frame, timestamp_str)

        # Step 2: Track objects across consecutive frames
        tracked_objects = self.tracker.update(raw_detections, frame_idx, timestamp_str)

        # Step 3: Appearance extraction & ReID association
        for obj in tracked_objects:
            tid = obj["track_id"]
            bbox = obj["bbox"]
            cls_name = obj["class"]

            # Crop object from frame
            bx, by, bw, bh = bbox["x"], bbox["y"], bbox["width"], bbox["height"]
            ih, iw = frame.shape[:2]
            cx1 = max(0, min(iw - 1, bx))
            cy1 = max(0, min(ih - 1, by))
            cx2 = max(0, min(iw, bx + bw))
            cy2 = max(0, min(ih, by + bh))

            crop = frame[cy1:cy2, cx1:cx2]

            if crop.size > 0 and tid not in self.track_evidence_captured:
                # First appearance: Extract visual embedding & Match against ReID gallery
                embedding = self.reid_engine.extract_embedding(crop)

                matched_pid, sim_score, match_label = self.reid_engine.match_against_gallery(
                    embedding, self.persistent_gallery, class_name=cls_name
                )

                if matched_pid is not None:
                    obj["persistent_id"] = matched_pid
                    obj["similarity_score"] = sim_score
                    obj["match_label"] = match_label
                    pid_assigned = matched_pid
                else:
                    # New persistent identity
                    pid_assigned = f"{cls_name.capitalize()} #{self.persistent_counter:04d}"
                    self.persistent_counter += 1
                    obj["persistent_id"] = pid_assigned
                    obj["similarity_score"] = 1.0
                    obj["match_label"] = "New registration"
                    # Add to local gallery
                    self.persistent_gallery.append({
                        "persistent_id": pid_assigned,
                        "class_name": cls_name,
                        "embedding": embedding,
                    })

                # Save evidence image for first appearance
                evidence_filename = f"ev_{self.camera_name}_{cls_name}_{tid}_{int(time.time()*1000)}.jpg"
                evidence_path = os.path.join(self.evidence_dir, evidence_filename)
                # Draw bounding box on a thumbnail for crisp evidence
                ev_frame = frame.copy()
                cv2.rectangle(ev_frame, (cx1, cy1), (cx2, cy2), (0, 255, 0), 2)
                cv2.putText(
                    ev_frame,
                    f"{pid_assigned} ({int(obj['confidence'] * 100)}%)",
                    (cx1, max(20, cy1 - 10)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (0, 255, 0),
                    2
                )
                cv2.imwrite(evidence_path, ev_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])

                self.track_evidence_captured[tid] = {
                    "evidence_path": evidence_filename,
                    "persistent_id": pid_assigned,
                    "similarity_score": sim_score if matched_pid else 1.0,
                    "confidence": obj["confidence"],
                    "embedding": embedding.tolist()
                }

                if self.event_callback:
                    self.event_callback("object.detected", {
                        "camera_id": self.camera_id,
                        "camera_name": self.camera_name,
                        "track_id": tid,
                        "persistent_id": pid_assigned,
                        "similarity_score": sim_score if matched_pid else 1.0,
                        "match_label": match_label if matched_pid else "New registration",
                        "object_type": cls_name,
                        "confidence": obj["confidence"],
                        "bbox": bbox,
                        "evidence_image": evidence_filename,
                        "timestamp": timestamp_str
                    })
            elif tid in self.track_evidence_captured:
                cached = self.track_evidence_captured[tid]
                obj["persistent_id"] = cached["persistent_id"]
                obj["similarity_score"] = cached["similarity_score"]

        # Step 4: Evaluate Zone Rules & Alerts
        alerts = []
        if self.zone_analyzer:
            alerts = self.zone_analyzer.evaluate_frame(tracked_objects, elapsed_seconds)
            for alert in alerts:
                alert["camera_id"] = self.camera_id
                alert["camera_name"] = self.camera_name
                if self.event_callback:
                    self.event_callback("alert.created", alert)

        return {
            "frame_idx": frame_idx,
            "timestamp": timestamp_str,
            "tracked_objects": tracked_objects,
            "alerts": alerts,
        }

    def process_video_file(
        self,
        video_path: str,
        progress_callback: Optional[Callable[[float, Dict[str, Any]], None]] = None
    ) -> Dict[str, Any]:
        """
        Processes a full recorded video file with frame skipping to adhere to processing_fps.
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Unable to open video stream at: {video_path}")

        source_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1
        frame_interval = max(1, int(round(source_fps / self.processing_fps)))

        frame_idx = 0
        processed_count = 0
        all_results = []
        all_alerts = []
        summary_counts: Dict[str, int] = {}
        unique_objects: Dict[str, Dict[str, Any]] = {}

        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_idx % frame_interval == 0:
                    current_seconds = frame_idx / source_fps
                    time_str = datetime.now(timezone.utc).isoformat()
                    res = self.process_frame(frame, frame_idx, time_str, current_seconds)
                    all_results.append(res)
                    all_alerts.extend(res.get("alerts", []))

                    # Track summary
                    for obj in res["tracked_objects"]:
                        cls = obj["class"]
                        summary_counts[cls] = summary_counts.get(cls, 0) + 1
                        pid = obj.get("persistent_id") or f"{cls} #{obj['track_id']}"
                        if pid not in unique_objects:
                            unique_objects[pid] = {
                                "persistent_id": pid,
                                "class": cls,
                                "first_seen": time_str,
                                "last_seen": time_str,
                                "evidence_image": self.track_evidence_captured.get(obj["track_id"], {}).get("evidence_path", ""),
                                "visits": 1
                            }
                        else:
                            unique_objects[pid]["last_seen"] = time_str

                    processed_count += 1
                    if progress_callback and processed_count % 5 == 0:
                        progress = min(1.0, frame_idx / float(total_frames))
                        progress_callback(progress, {
                            "frame_idx": frame_idx,
                            "total_frames": total_frames,
                            "tracked_now": len(res["tracked_objects"]),
                            "unique_objects": len(unique_objects)
                        })

                frame_idx += 1
        finally:
            cap.release()

        return {
            "total_frames": total_frames,
            "processed_frames": processed_count,
            "summary_counts": summary_counts,
            "unique_objects": list(unique_objects.values()),
            "alerts": all_alerts,
            "evidence_items": list(self.track_evidence_captured.values())
        }
