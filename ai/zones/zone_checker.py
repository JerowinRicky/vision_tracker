"""
Zone Analyzer and Point-in-Polygon Engine.
Evaluates spatial violations, entries, exits, loitering/dwell time,
and occupancy counts for user-configured polygon zones.
"""

from typing import List, Dict, Any, Tuple


class Point:
    def __init__(self, x: float, y: float):
        self.x = float(x)
        self.y = float(y)


def is_point_in_polygon(point: Point, polygon: List[Point]) -> bool:
    """
    Ray-casting algorithm to determine if a point is inside a polygon.
    polygon: list of Point objects in clockwise or counter-clockwise order.
    """
    num_vertices = len(polygon)
    if num_vertices < 3:
        return False

    inside = False
    p1 = polygon[0]
    for i in range(num_vertices + 1):
        p2 = polygon[i % num_vertices]
        if point.y > min(p1.y, p2.y):
            if point.y <= max(p1.y, p2.y):
                if point.x <= max(p1.x, p2.x):
                    if p1.y != p2.y:
                        xinters = (point.y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y) + p1.x
                    if p1.x == p2.x or point.x <= xinters:
                        inside = not inside
        p1 = p2

    return inside


class ZoneAnalyzer:
    def __init__(self, zones_config: List[Dict[str, Any]]):
        """
        zones_config: list of dicts:
        {
            "id": 1,
            "name": "Restricted Area",
            "zone_type": "restricted", # or entrance, parking, warehouse
            "polygon": [{"x": 100, "y": 150}, {"x": 300, "y": 150}, ...],
            "rules": ["person_entry", "vehicle_entry", "dwell_time", "occupancy"],
            "max_dwell_seconds": 60,
            "max_occupancy": 5
        }
        """
        self.zones = zones_config
        # Track previous frame object locations: {zone_id: {track_id: enter_time}}
        self.zone_presence: Dict[int, Dict[int, float]] = {z["id"]: {} for z in zones_config}

    def evaluate_frame(
        self,
        tracked_objects: List[Dict[str, Any]],
        current_time_seconds: float
    ) -> List[Dict[str, Any]]:
        """
        Evaluates tracked objects against all configured zones.
        Returns triggered alert events.
        """
        alerts = []

        for zone in self.zones:
            zone_id = zone["id"]
            zone_name = zone["name"]
            zone_type = zone.get("zone_type", "custom")
            poly_points = [Point(pt["x"], pt["y"]) for pt in zone.get("polygon", [])]
            if len(poly_points) < 3:
                continue

            current_present_tids = set()

            for obj in tracked_objects:
                tid = obj["track_id"]
                cls_name = obj["class"]
                bbox = obj["bbox"]
                # Bottom-center point of bounding box (feet / tires on ground)
                feet_point = Point(bbox["x"] + bbox["width"] / 2.0, bbox["y"] + bbox["height"])

                inside = is_point_in_polygon(feet_point, poly_points)

                if inside:
                    current_present_tids.add(tid)
                    if tid not in self.zone_presence[zone_id]:
                        # ENTRY EVENT
                        self.zone_presence[zone_id][tid] = current_time_seconds
                        if zone_type == "restricted" or "entry" in zone.get("rules", []):
                            alerts.append({
                                "zone_id": zone_id,
                                "zone_name": zone_name,
                                "alert_type": "restricted_zone_entry" if zone_type == "restricted" else "zone_entry",
                                "severity": "critical" if zone_type == "restricted" else "warning",
                                "message": f"{cls_name.capitalize()} #{tid} entered {zone_name}",
                                "track_id": tid,
                                "object_type": cls_name,
                                "timestamp": obj.get("last_timestamp", "")
                            })
                    else:
                        # DWELL TIME CHECK
                        dwell_time = current_time_seconds - self.zone_presence[zone_id][tid]
                        max_dwell = zone.get("max_dwell_seconds", 30)
                        if dwell_time > max_dwell:
                            alerts.append({
                                "zone_id": zone_id,
                                "zone_name": zone_name,
                                "alert_type": "dwell_time_exceeded",
                                "severity": "warning",
                                "message": f"{cls_name.capitalize()} #{tid} remained in {zone_name} for {int(dwell_time)}s (limit: {max_dwell}s)",
                                "track_id": tid,
                                "object_type": cls_name,
                                "timestamp": obj.get("last_timestamp", "")
                            })

            # Check exits
            prev_tids = list(self.zone_presence[zone_id].keys())
            for tid in prev_tids:
                if tid not in current_present_tids:
                    # Exited
                    del self.zone_presence[zone_id][tid]

            # Occupancy rule check
            max_occ = zone.get("max_occupancy")
            if max_occ and len(current_present_tids) > max_occ:
                alerts.append({
                    "zone_id": zone_id,
                    "zone_name": zone_name,
                    "alert_type": "occupancy_exceeded",
                    "severity": "high",
                    "message": f"Zone {zone_name} occupancy exceeded ({len(current_present_tids)} > {max_occ})",
                    "timestamp": ""
                })

        return alerts


class ZoneChecker:
    """Helper wrapper for direct point-in-polygon queries."""

    @staticmethod
    def is_point_in_polygon(point, polygon):
        if isinstance(point, (list, tuple)):
            p = Point(point[0], point[1])
        elif isinstance(point, dict):
            p = Point(point['x'], point['y'])
        else:
            p = point
        poly = [Point(pt['x'], pt['y']) if isinstance(pt, dict) else pt for pt in polygon]
        return is_point_in_polygon(p, poly)

