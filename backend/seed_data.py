import os
import sys
import django
from datetime import datetime, timedelta, timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User
from apps.cameras.models import Camera
from apps.zones.models import Zone
from apps.objects.models import PersistentObject, EvidenceImage
from apps.visits.models import Visit
from apps.alerts.models import Alert
from apps.audit.models import AuditLog
from apps.settings.models import SystemSetting, DEFAULT_SETTINGS


def seed():
    print("Starting VisionTrack AI database seeding...")

    # 1. Users
    if not User.objects.filter(username='admin').exists():
        admin = User.objects.create_superuser('admin', 'admin@visiontrack.ai', 'admin123456')
        admin.role = User.ROLE_ADMIN
        admin.first_name = "System"
        admin.last_name = "Administrator"
        admin.save()
        print("Created Admin user: admin / admin123456")

    if not User.objects.filter(username='operator').exists():
        op = User.objects.create_user('operator', 'operator@visiontrack.ai', 'operator123456')
        op.role = User.ROLE_OPERATOR
        op.first_name = "Alex"
        op.last_name = "Rivera"
        op.save()
        print("Created Operator user: operator / operator123456")

    if not User.objects.filter(username='viewer').exists():
        viewer = User.objects.create_user('viewer', 'viewer@visiontrack.ai', 'viewer123456')
        viewer.role = User.ROLE_VIEWER
        viewer.first_name = "Sam"
        viewer.last_name = "Taylor"
        viewer.save()
        print("Created Viewer user: viewer / viewer123456")

    # 2. Cameras
    cams = [
        {
            "camera_id": "CAM-01",
            "name": "Main Entrance East",
            "stream_type": Camera.TYPE_SIMULATED,
            "stream_url": "simulated://main-entrance",
            "resolution": "1920x1080",
            "fps": 30,
            "processing_fps": 10,
            "detection_model": "yolov8n",
            "confidence_threshold": 0.50,
            "tracking_algorithm": "bytetrack",
            "status": Camera.STATUS_ONLINE
        },
        {
            "camera_id": "CAM-02",
            "name": "North Parking Bay",
            "stream_type": Camera.TYPE_SIMULATED,
            "stream_url": "simulated://parking-bay",
            "resolution": "1920x1080",
            "fps": 30,
            "processing_fps": 10,
            "detection_model": "yolov8n",
            "confidence_threshold": 0.55,
            "tracking_algorithm": "botsort",
            "status": Camera.STATUS_ONLINE
        },
        {
            "camera_id": "CAM-03",
            "name": "Warehouse Loading Dock",
            "stream_type": Camera.TYPE_SIMULATED,
            "stream_url": "simulated://loading-dock",
            "resolution": "1920x1080",
            "fps": 25,
            "processing_fps": 10,
            "detection_model": "yolov8s",
            "confidence_threshold": 0.60,
            "tracking_algorithm": "bytetrack",
            "status": Camera.STATUS_ONLINE
        },
        {
            "camera_id": "CAM-04",
            "name": "Perimeter Gate West",
            "stream_type": Camera.TYPE_SIMULATED,
            "stream_url": "simulated://perimeter-west",
            "resolution": "1280x720",
            "fps": 15,
            "processing_fps": 5,
            "detection_model": "yolov8n",
            "confidence_threshold": 0.50,
            "tracking_algorithm": "bytetrack",
            "status": Camera.STATUS_ONLINE
        },
    ]

    camera_map = {}
    for c_data in cams:
        cam, _ = Camera.objects.update_or_create(camera_id=c_data["camera_id"], defaults=c_data)
        camera_map[cam.camera_id] = cam
    print(f"Seeded {len(camera_map)} cameras.")

    # 3. Polygon Zones
    zones = [
        {
            "camera": camera_map["CAM-01"],
            "name": "Main Entrance Turnstile",
            "zone_type": Zone.ZONE_ENTRANCE,
            "polygon_points": [{"x": 120, "y": 200}, {"x": 380, "y": 200}, {"x": 380, "y": 460}, {"x": 120, "y": 460}],
            "rules": ["person_entry", "occupancy"],
            "max_occupancy": 8,
            "color_hex": "#10B981"
        },
        {
            "camera": camera_map["CAM-03"],
            "name": "Restricted High-Voltage Area",
            "zone_type": Zone.ZONE_RESTRICTED,
            "polygon_points": [{"x": 350, "y": 100}, {"x": 620, "y": 100}, {"x": 620, "y": 380}, {"x": 350, "y": 380}],
            "rules": ["person_entry", "dwell_time"],
            "max_dwell_seconds": 15,
            "color_hex": "#EF4444"
        },
        {
            "camera": camera_map["CAM-02"],
            "name": "VIP Parking Zone",
            "zone_type": Zone.ZONE_PARKING,
            "polygon_points": [{"x": 50, "y": 150}, {"x": 300, "y": 150}, {"x": 300, "y": 420}, {"x": 50, "y": 420}],
            "rules": ["vehicle_entry", "dwell_time"],
            "max_dwell_seconds": 300,
            "color_hex": "#3B82F6"
        }
    ]

    for z_data in zones:
        Zone.objects.update_or_create(name=z_data["name"], defaults=z_data)
    print("Seeded polygon zones.")

    # 4. Persistent Objects & Visits
    now = datetime.now(timezone.utc)
    objects_data = [
        {
            "internal_id": "Person #0042",
            "object_type": "Person",
            "first_seen": now - timedelta(hours=9, minutes=15),
            "last_seen": now - timedelta(minutes=5),
            "total_visits": 5,
            "total_duration_seconds": 4980, # 1h 23m
            "primary_evidence_image": "evidence/ev_cam01_person42.jpg",
            "notes": "Frequent visitor. Authorized staff / contractor.",
            "visits": [
                {"cam": "CAM-01", "start": now - timedelta(hours=9, minutes=15), "duration": 900},
                {"cam": "CAM-01", "start": now - timedelta(hours=7, minutes=20), "duration": 780},
                {"cam": "CAM-03", "start": now - timedelta(hours=3, minutes=30), "duration": 960},
                {"cam": "CAM-01", "start": now - timedelta(hours=1, minutes=10), "duration": 840},
                {"cam": "CAM-01", "start": now - timedelta(minutes=25), "duration": 1500},
            ]
        },
        {
            "internal_id": "Person #0071",
            "object_type": "Person",
            "first_seen": now - timedelta(hours=8, minutes=45),
            "last_seen": now - timedelta(hours=5, minutes=10),
            "total_visits": 2,
            "total_duration_seconds": 2460, # 41m
            "primary_evidence_image": "evidence/ev_cam01_person71.jpg",
            "notes": "Client scheduled for conference meeting.",
            "visits": [
                {"cam": "CAM-01", "start": now - timedelta(hours=8, minutes=45), "duration": 1200},
                {"cam": "CAM-01", "start": now - timedelta(hours=5, minutes=31), "duration": 1260},
            ]
        },
        {
            "internal_id": "Person #0098",
            "object_type": "Person",
            "first_seen": now - timedelta(hours=6, minutes=30),
            "last_seen": now - timedelta(hours=5, minutes=45),
            "total_visits": 1,
            "total_duration_seconds": 2700, # 45m
            "primary_evidence_image": "evidence/ev_cam03_person98.jpg",
            "notes": "Auditor inspecting warehouse floor.",
            "visits": [
                {"cam": "CAM-03", "start": now - timedelta(hours=6, minutes=30), "duration": 2700},
            ]
        },
        {
            "internal_id": "Car #0017",
            "object_type": "Car",
            "first_seen": now - timedelta(hours=9, minutes=35),
            "last_seen": now - timedelta(minutes=12),
            "total_visits": 2,
            "total_duration_seconds": 32400,
            "primary_evidence_image": "evidence/ev_cam02_car17.jpg",
            "notes": "Silver sedan parked in Executive stall 4.",
            "visits": [
                {"cam": "CAM-02", "start": now - timedelta(hours=9, minutes=35), "duration": 16200},
                {"cam": "CAM-02", "start": now - timedelta(hours=4, minutes=40), "duration": 16200},
            ]
        },
        {
            "internal_id": "Truck #0004",
            "object_type": "Truck",
            "first_seen": now - timedelta(hours=7, minutes=0),
            "last_seen": now - timedelta(hours=6, minutes=15),
            "total_visits": 1,
            "total_duration_seconds": 2700,
            "primary_evidence_image": "evidence/ev_cam03_truck04.jpg",
            "notes": "Logistics delivery vehicle at dock 2.",
            "visits": [
                {"cam": "CAM-03", "start": now - timedelta(hours=7, minutes=0), "duration": 2700},
            ]
        },
        {
            "internal_id": "Dog #0007",
            "object_type": "Dog",
            "first_seen": now - timedelta(hours=2, minutes=10),
            "last_seen": now - timedelta(hours=1, minutes=55),
            "total_visits": 1,
            "total_duration_seconds": 900,
            "primary_evidence_image": "evidence/ev_cam04_dog07.jpg",
            "notes": "K9 security inspection patrol.",
            "visits": [
                {"cam": "CAM-04", "start": now - timedelta(hours=2, minutes=10), "duration": 900},
            ]
        }
    ]

    for od in objects_data:
        visits = od.pop("visits")
        pobj, _ = PersistentObject.objects.update_or_create(internal_id=od["internal_id"], defaults=od)
        pobj.cameras.add(camera_map["CAM-01"])
        if "CAM-03" in [v["cam"] for v in visits]:
            pobj.cameras.add(camera_map["CAM-03"])
        if "CAM-02" in [v["cam"] for v in visits]:
            pobj.cameras.add(camera_map["CAM-02"])

        # Create Evidence Image
        ev, _ = EvidenceImage.objects.get_or_create(
            persistent_object=pobj,
            event_type=EvidenceImage.EVENT_FIRST_APPEARANCE,
            defaults={
                "camera": camera_map[visits[0]["cam"]],
                "confidence": 0.94,
                "similarity_score": 0.91 if pobj.total_visits > 1 else 1.0,
                "captured_at": pobj.first_seen,
                "image": od["primary_evidence_image"]
            }
        )

        # Create visits
        for idx, v in enumerate(visits, 1):
            start = v["start"]
            end = start + timedelta(seconds=v["duration"])
            Visit.objects.get_or_create(
                persistent_object=pobj,
                visit_number=idx,
                defaults={
                    "camera": camera_map[v["cam"]],
                    "start_time": start,
                    "end_time": end,
                    "duration_seconds": v["duration"],
                    "entry_evidence": ev
                }
            )

    print("Seeded persistent objects and visit histories.")

    # 5. Alerts
    alerts = [
        {
            "camera": camera_map["CAM-03"],
            "alert_type": "restricted_zone_entry",
            "severity": Alert.SEVERITY_CRITICAL,
            "title": "Restricted Zone Breach Detected",
            "message": "Person #0098 crossed into Restricted High-Voltage Area without badge clearance.",
            "is_read": False,
        },
        {
            "camera": camera_map["CAM-02"],
            "alert_type": "dwell_time_exceeded",
            "severity": Alert.SEVERITY_WARNING,
            "title": "Parking Bay Dwell Limit Exceeded",
            "message": "Car #0017 has remained stationary in VIP parking zone for over 4 hours.",
            "is_read": False,
        },
        {
            "camera": camera_map["CAM-04"],
            "alert_type": "perimeter_motion",
            "severity": Alert.SEVERITY_INFO,
            "title": "Perimeter Motion Verified",
            "message": "Dog #0007 verified during regular perimeter patrol route.",
            "is_read": True,
        }
    ]

    for a_data in alerts:
        Alert.objects.get_or_create(title=a_data["title"], defaults=a_data)
    print("Seeded alerts.")

    # 6. Audit Logs
    audit_events = [
        ("SETTINGS_UPDATED", "settings", "1", {"changed": "detection_threshold to 0.50"}, "admin"),
        ("CAMERA_ADDED", "camera", "CAM-04", {"name": "Perimeter Gate West"}, "admin"),
        ("ZONE_MODIFIED", "zone", "2", {"rule": "dwell_time enabled"}, "operator"),
        ("USER_LOGIN", "user", "admin", {"method": "JWT"}, "admin"),
        ("REPORT_GENERATED", "report", "Daily_Visitor_20261027", {"format": "pdf"}, "operator"),
    ]

    for act, res, rid, det, user in audit_events:
        AuditLog.objects.create(
            action=act,
            resource_type=res,
            resource_id=rid,
            details=det,
            username=user,
            ip_address="127.0.0.1"
        )
    print("Seeded audit logs.")

    # 7. System Settings
    for k, v in DEFAULT_SETTINGS.items():
        cat = "general"
        for prefix in ["detection", "tracking", "reid", "evidence", "retention", "alert", "storage", "ui"]:
            if k.startswith(prefix):
                cat = prefix
                break
        SystemSetting.set_setting(k, v, category=cat)
    print("Seeded system settings.")

    print("\n[SUCCESS] VisionTrack AI database successfully seeded with production demonstration data!")


if __name__ == '__main__':
    seed()
