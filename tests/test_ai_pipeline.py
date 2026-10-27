import numpy as np
from ai.detection.detector import ObjectDetector
from ai.tracking.tracker import MultiObjectTracker
from ai.reid.reid_engine import ReIDEngine
from ai.zones.zone_checker import ZoneAnalyzer, Point, is_point_in_polygon


def test_tracker_association():
    tracker = MultiObjectTracker()
    # Frame 1: Detection at (100, 100, 50, 100)
    dets_1 = [{"class": "person", "confidence": 0.95, "bbox": [100, 100, 50, 100]}]
    tracks_1 = tracker.update(dets_1, frame_idx=1, timestamp="2026-10-27T10:00:00")
    assert len(tracks_1) == 1
    tid = tracks_1[0]["track_id"]

    # Frame 2: Object moves slightly to (105, 102, 50, 100)
    dets_2 = [{"class": "person", "confidence": 0.94, "bbox": [105, 102, 50, 100]}]
    tracks_2 = tracker.update(dets_2, frame_idx=2, timestamp="2026-10-27T10:00:01")
    assert len(tracks_2) == 1
    # Track ID should be maintained!
    assert tracks_2[0]["track_id"] == tid


def test_reid_similarity_and_matching():
    reid = ReIDEngine(similarity_threshold=0.80)
    # Generate two synthetic color patches
    patch_blue_1 = np.zeros((128, 64, 3), dtype=np.uint8)
    patch_blue_1[:] = (200, 50, 50)  # BGR blue

    patch_blue_2 = np.zeros((128, 64, 3), dtype=np.uint8)
    patch_blue_2[:] = (205, 52, 48)  # very similar blue

    patch_red = np.zeros((128, 64, 3), dtype=np.uint8)
    patch_red[:] = (30, 30, 220)  # BGR bright red

    emb_b1 = reid.extract_embedding(patch_blue_1)
    emb_b2 = reid.extract_embedding(patch_blue_2)
    emb_red = reid.extract_embedding(patch_red)

    sim_similar = reid.compute_similarity(emb_b1, emb_b2)
    sim_different = reid.compute_similarity(emb_b1, emb_red)

    assert sim_similar > 0.85
    assert sim_different < sim_similar

    gallery = [
        {"persistent_id": "Person #0042", "class_name": "person", "embedding": emb_b1}
    ]
    matched_id, score, label = reid.match_against_gallery(emb_b2, gallery, class_name="person")
    assert matched_id == "Person #0042"
    assert "match" in label.lower() or "likely" in label.lower()


def test_point_in_polygon_and_zone_analyzer():
    poly = [Point(0, 0), Point(100, 0), Point(100, 100), Point(0, 100)]
    inside_pt = Point(50, 50)
    outside_pt = Point(150, 50)

    assert is_point_in_polygon(inside_pt, poly) is True
    assert is_point_in_polygon(outside_pt, poly) is False

    zone_config = [{
        "id": 1,
        "name": "Restricted Dock",
        "zone_type": "restricted",
        "polygon": [{"x": 100, "y": 100}, {"x": 300, "y": 100}, {"x": 300, "y": 300}, {"x": 100, "y": 300}],
        "rules": ["person_entry"],
        "max_dwell_seconds": 10,
        "max_occupancy": 2
    }]
    analyzer = ZoneAnalyzer(zone_config)

    # Object at feet position (200, 200) inside zone
    obj = {
        "track_id": 42,
        "class": "person",
        "bbox": {"x": 180, "y": 100, "width": 40, "height": 100}, # bottom feet at (200, 200)
        "last_timestamp": "2026-10-27T10:00:00"
    }
    alerts = analyzer.evaluate_frame([obj], current_time_seconds=0.0)
    assert len(alerts) == 1
    assert alerts[0]["alert_type"] == "restricted_zone_entry"
