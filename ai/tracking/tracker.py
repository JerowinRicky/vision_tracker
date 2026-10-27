"""
ByteTrack & BoT-SORT Multi-Object Tracking Engine.
Maintains identity across frames, produces temporary track IDs,
and records trajectory movement paths.
"""

import numpy as np
from typing import List, Dict, Any, Tuple
from .kalman import KalmanBoxTracker


def bbox_iou(bb_test, bb_gt):
    """
    Computes Intersection over Union (IoU) between two boxes [x1, y1, x2, y2].
    """
    xx1 = np.maximum(bb_test[0], bb_gt[0])
    yy1 = np.maximum(bb_test[1], bb_gt[1])
    xx2 = np.minimum(bb_test[2], bb_gt[2])
    yy2 = np.minimum(bb_test[3], bb_gt[3])
    w = np.maximum(0.0, xx2 - xx1)
    h = np.maximum(0.0, yy2 - yy1)
    wh = w * h
    o = wh / (
        (bb_test[2] - bb_test[0]) * (bb_test[3] - bb_test[1])
        + (bb_gt[2] - bb_gt[0]) * (bb_gt[3] - bb_gt[1])
        - wh
        + 1e-6
    )
    return o


def associate_detections_to_trackers(detections, trackers, iou_threshold=0.3):
    """
    Assigns detections to tracked object using Hungarian / Greedy IoU association.
    """
    if len(trackers) == 0:
        return np.empty((0, 2), dtype=int), np.arange(len(detections)), np.empty((0,), dtype=int)

    iou_matrix = np.zeros((len(detections), len(trackers)), dtype=np.float32)
    for d, det in enumerate(detections):
        for t, trk in enumerate(trackers):
            iou_matrix[d, t] = bbox_iou(det, trk)

    # Greedy matching (fast & reliable)
    matched_indices = []
    unmatched_detections = set(range(len(detections)))
    unmatched_trackers = set(range(len(trackers)))

    # Sort pairs by IoU in descending order
    flat_indices = np.argsort(-iou_matrix.ravel())
    for idx in flat_indices:
        d, t = divmod(idx, len(trackers))
        if d in unmatched_detections and t in unmatched_trackers:
            if iou_matrix[d, t] >= iou_threshold:
                matched_indices.append((d, t))
                unmatched_detections.remove(d)
                unmatched_trackers.remove(t)

    matched = np.array(matched_indices) if matched_indices else np.empty((0, 2), dtype=int)
    return matched, np.array(list(unmatched_detections), dtype=int), np.array(list(unmatched_trackers), dtype=int)


class TrackedObject:
    def __init__(self, track_id: int, bbox: List[float], class_name: str, confidence: float, frame_idx: int, timestamp: str):
        self.track_id = track_id
        self.class_name = class_name
        self.confidence = confidence
        self.first_frame = frame_idx
        self.last_frame = frame_idx
        self.first_timestamp = timestamp
        self.last_timestamp = timestamp
        self.bbox = bbox  # [x, y, w, h]
        self.trajectory: List[Tuple[float, float]] = [(bbox[0] + bbox[2] / 2.0, bbox[1] + bbox[3] / 2.0)]
        self.kalman = KalmanBoxTracker([bbox[0], bbox[1], bbox[0] + bbox[2], bbox[1] + bbox[3]])
        self.time_since_update = 0
        self.hit_streak = 1
        self.total_frames = 1
        self.best_confidence = confidence
        self.best_bbox = bbox
        self.best_frame_idx = frame_idx
        self.is_active = True
        self.persistent_id = None
        self.similarity_score = 0.0

    def predict(self):
        pred_box = self.kalman.predict()
        self.time_since_update = self.kalman.time_since_update
        return pred_box

    def update(self, bbox: List[float], confidence: float, frame_idx: int, timestamp: str):
        self.bbox = bbox
        self.confidence = confidence
        self.last_frame = frame_idx
        self.last_timestamp = timestamp
        self.total_frames += 1
        center_x = bbox[0] + bbox[2] / 2.0
        center_y = bbox[1] + bbox[3] / 2.0
        self.trajectory.append((center_x, center_y))
        if len(self.trajectory) > 50:
            self.trajectory.pop(0)

        if confidence > self.best_confidence:
            self.best_confidence = confidence
            self.best_bbox = bbox
            self.best_frame_idx = frame_idx

        self.kalman.update([bbox[0], bbox[1], bbox[0] + bbox[2], bbox[1] + bbox[3]])
        self.time_since_update = 0
        self.hit_streak += 1


class MultiObjectTracker:
    def __init__(
        self,
        algorithm: str = "bytetrack",
        max_lost_frames: int = 30,
        min_hits: int = 2,
        high_conf_thresh: float = 0.5,
        low_conf_thresh: float = 0.2,
        iou_threshold: float = 0.3,
    ):
        self.algorithm = algorithm.lower()
        self.max_lost_frames = max_lost_frames
        self.min_hits = min_hits
        self.high_conf_thresh = high_conf_thresh
        self.low_conf_thresh = low_conf_thresh
        self.iou_threshold = iou_threshold
        self.tracks: Dict[int, TrackedObject] = {}
        self.next_id = 1

    def update(
        self,
        detections: List[Dict[str, Any]],
        frame_idx: int,
        timestamp: str
    ) -> List[Dict[str, Any]]:
        """
        Updates trackers using ByteTrack two-stage association strategy.
        detections: List of dicts with keys: 'bbox': [x, y, w, h], 'confidence', 'class'
        """
        # Step 1: Predict new locations for active trackers
        track_ids = list(self.tracks.keys())
        predicted_boxes = []
        for tid in track_ids:
            pred = self.tracks[tid].predict()
            predicted_boxes.append(pred)

        # Separate detections into high-confidence and low-confidence
        high_dets = []
        high_indices = []
        low_dets = []
        low_indices = []

        for i, det in enumerate(detections):
            bbox = det["bbox"]
            box_xyxy = [bbox[0], bbox[1], bbox[0] + bbox[2], bbox[1] + bbox[3]]
            if det["confidence"] >= self.high_conf_thresh:
                high_dets.append(box_xyxy)
                high_indices.append(i)
            elif det["confidence"] >= self.low_conf_thresh:
                low_dets.append(box_xyxy)
                low_indices.append(i)

        high_dets = np.array(high_dets) if high_dets else np.empty((0, 4))
        low_dets = np.array(low_dets) if low_dets else np.empty((0, 4))
        pred_boxes = np.array(predicted_boxes) if predicted_boxes else np.empty((0, 4))

        # First association: High confidence detections with predicted track boxes
        matched_1, unmatched_high_dets, unmatched_tracks_1 = associate_detections_to_trackers(
            high_dets, pred_boxes, self.iou_threshold
        )

        for m in matched_1:
            det_idx = high_indices[m[0]]
            tid = track_ids[m[1]]
            det = detections[det_idx]
            self.tracks[tid].update(det["bbox"], det["confidence"], frame_idx, timestamp)

        # Second association (ByteTrack style): Remaining tracks with low confidence detections
        remaining_track_ids = [track_ids[t] for t in unmatched_tracks_1]
        remaining_pred_boxes = np.array([predicted_boxes[t] for t in unmatched_tracks_1]) if len(unmatched_tracks_1) > 0 else np.empty((0, 4))

        if len(low_dets) > 0 and len(remaining_pred_boxes) > 0:
            matched_2, unmatched_low_dets, unmatched_tracks_2 = associate_detections_to_trackers(
                low_dets, remaining_pred_boxes, self.iou_threshold * 0.7  # slightly relaxed IoU
            )
            for m in matched_2:
                det_idx = low_indices[m[0]]
                tid = remaining_track_ids[m[1]]
                det = detections[det_idx]
                self.tracks[tid].update(det["bbox"], det["confidence"], frame_idx, timestamp)
            unmatched_tracks_final = [remaining_track_ids[t] for t in unmatched_tracks_2]
        else:
            unmatched_tracks_final = remaining_track_ids

        # Unmatched high-confidence detections initiate new tracks
        for d in unmatched_high_dets:
            det_idx = high_indices[d]
            det = detections[det_idx]
            tid = self.next_id
            self.next_id += 1
            new_track = TrackedObject(
                track_id=tid,
                bbox=det["bbox"],
                class_name=det["class"],
                confidence=det["confidence"],
                frame_idx=frame_idx,
                timestamp=timestamp
            )
            self.tracks[tid] = new_track

        # Remove dead tracks
        dead_ids = []
        for tid in unmatched_tracks_final:
            if self.tracks[tid].time_since_update > self.max_lost_frames:
                self.tracks[tid].is_active = False
                dead_ids.append(tid)

        for tid in dead_ids:
            del self.tracks[tid]

        # Return currently active tracks that meet min_hits
        active_results = []
        for tid, trk in self.tracks.items():
            if trk.time_since_update == 0 and (trk.hit_streak >= self.min_hits or frame_idx <= self.min_hits):
                active_results.append({
                    "track_id": trk.track_id,
                    "class": trk.class_name,
                    "confidence": round(float(trk.confidence), 3),
                    "bbox": {
                        "x": int(trk.bbox[0]),
                        "y": int(trk.bbox[1]),
                        "width": int(trk.bbox[2]),
                        "height": int(trk.bbox[3])
                    },
                    "trajectory": [[int(pt[0]), int(pt[1])] for pt in trk.trajectory[-20:]],
                    "first_frame": trk.first_frame,
                    "last_frame": trk.last_frame,
                    "first_timestamp": trk.first_timestamp,
                    "last_timestamp": trk.last_timestamp,
                    "persistent_id": trk.persistent_id,
                    "similarity_score": trk.similarity_score
                })

        return active_results
