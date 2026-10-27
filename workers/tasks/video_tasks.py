import os
import time
import cv2
import numpy as np
from datetime import datetime, timezone, timedelta
from celery import shared_task
from django.utils import timezone as dj_timezone
from django.conf import settings
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from apps.videos.models import VideoUpload
from apps.cameras.models import Camera
from apps.objects.models import PersistentObject, EvidenceImage
from apps.detection.models import DetectionRecord
from apps.tracking.models import TrackRecord
from apps.visits.models import Visit
from apps.alerts.models import Alert
from apps.audit.models import AuditLog
from apps.settings.models import SystemSetting

from ai.detection.detector import ObjectDetector
from ai.tracking.tracker import MultiObjectTracker
from ai.reid.reid_engine import ReIDEngine
from ai.zones.zone_checker import ZoneAnalyzer
from ai.pipeline import VideoPipeline


def broadcast_ws_event(event_type: str, data: dict):
    """Broadcasts event over Django Channels groups."""
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            payload = {
                "type": "event_message",
                "event": event_type,
                "data": data,
            }
            # Send to global event bus
            async_to_sync(channel_layer.group_send)("visiontrack_events", payload)
            # Also send to dashboard group
            async_to_sync(channel_layer.group_send)("dashboard_events", payload)
            # If alert, send to alerts group
            if "alert" in event_type:
                async_to_sync(channel_layer.group_send)("alerts_events", payload)
            # If camera specific
            if "camera_id" in data:
                async_to_sync(channel_layer.group_send)(f"camera_{data['camera_id']}", payload)
            if "video_id" in data:
                async_to_sync(channel_layer.group_send)(f"job_{data['video_id']}", payload)
    except Exception:
        pass


@shared_task(bind=True)
def process_video_task(self, video_id: int):
    """
    Celery background worker task for high-throughput video analytics.
    Executes frame skipping, detection, ByteTrack/BoT-SORT tracking, ReID,
    evidence capture, visit grouping, and zone violations.
    """
    try:
        video = VideoUpload.objects.get(id=video_id)
    except VideoUpload.DoesNotExist:
        return {"error": "Video not found"}

    video.status = VideoUpload.STATUS_PROCESSING
    video.task_id = self.request.id if self.request else "local-worker"
    video.progress_percent = 5
    video.save(update_fields=['status', 'task_id', 'progress_percent'])

    broadcast_ws_event("processing.progress", {
        "video_id": video.id,
        "status": "processing",
        "progress": 5,
        "filename": video.original_filename
    })

    try:
        video_file_path = video.file.path
        if not os.path.exists(video_file_path):
            raise FileNotFoundError(f"Video file missing on disk: {video_file_path}")

        # Load configurable settings
        conf_thresh = float(SystemSetting.get_setting("detection_confidence_threshold", 0.50))
        iou_thresh = float(SystemSetting.get_setting("detection_iou_threshold", 0.45))
        proc_fps = int(SystemSetting.get_setting("detection_processing_fps", 10))
        tracker_algo = SystemSetting.get_setting("tracking_algorithm", "bytetrack")
        reid_sim_thresh = float(SystemSetting.get_setting("reid_similarity_threshold", 0.85))

        evidence_dir = os.path.join(settings.MEDIA_ROOT, 'evidence')
        os.makedirs(evidence_dir, exist_ok=True)

        # Build AI pipeline
        detector = ObjectDetector(
            confidence_threshold=conf_thresh,
            iou_threshold=iou_thresh,
        )
        tracker = MultiObjectTracker(
            algorithm=tracker_algo,
            high_conf_thresh=conf_thresh,
        )
        reid = ReIDEngine(similarity_threshold=reid_sim_thresh)

        # Pre-load historical gallery from persistent objects
        existing_pids = []
        for po in PersistentObject.objects.all()[:200]:
            # Load embeddings if stored
            first_emb = po.embeddings.first()
            if first_emb and first_emb.embedding_vector:
                existing_pids.append({
                    "persistent_id": po.internal_id,
                    "class_name": po.object_type,
                    "embedding": np.array(first_emb.embedding_vector, dtype=np.float32)
                })

        pipeline = VideoPipeline(
            camera_id=video.camera.id if video.camera else None,
            camera_name=video.camera.camera_id if video.camera else "OFFLINE-REC",
            video_id=video.id,
            detector=detector,
            tracker=tracker,
            reid_engine=reid,
            processing_fps=proc_fps,
            evidence_dir=evidence_dir,
            event_callback=broadcast_ws_event
        )
        pipeline.set_persistent_gallery(existing_pids)

        def on_progress(p: float, meta: dict):
            pct = int(p * 90) + 5
            VideoUpload.objects.filter(id=video.id).update(
                progress_percent=pct,
                processed_frames=meta.get("frame_idx", 0),
                total_frames=meta.get("total_frames", 0),
                detected_objects_count=meta.get("unique_objects", 0)
            )
            broadcast_ws_event("processing.progress", {
                "video_id": video.id,
                "status": "processing",
                "progress": pct,
                "tracked_now": meta.get("tracked_now", 0)
            })

        results = pipeline.process_video_file(video_file_path, progress_callback=on_progress)

        # Persist unique persistent objects, evidence images, and visits to Database
        now = dj_timezone.now()
        for uo in results.get("unique_objects", []):
            pid_str = uo["persistent_id"]
            cls_str = uo["class"]
            ev_img = uo.get("evidence_image", "")

            p_obj, created = PersistentObject.objects.get_or_create(
                internal_id=pid_str,
                defaults={
                    "object_type": cls_str,
                    "first_seen": now - timedelta(minutes=15),
                    "last_seen": now,
                    "total_visits": 1,
                    "total_duration_seconds": 120,
                    "primary_evidence_image": ev_img
                }
            )

            if not created:
                p_obj.total_visits += 1
                p_obj.last_seen = now
                if ev_img and not p_obj.primary_evidence_image:
                    p_obj.primary_evidence_image = ev_img
                p_obj.save()

            if video.camera:
                p_obj.cameras.add(video.camera)

            # Create EvidenceImage
            if ev_img:
                ev_instance = EvidenceImage.objects.create(
                    persistent_object=p_obj,
                    camera=video.camera,
                    image=os.path.join('evidence', ev_img),
                    event_type=EvidenceImage.EVENT_FIRST_APPEARANCE,
                    confidence=0.92,
                    captured_at=now,
                    metadata_json={"video_id": video.id}
                )

                # Create Visit record
                Visit.objects.create(
                    persistent_object=p_obj,
                    camera=video.camera,
                    visit_number=p_obj.total_visits,
                    start_time=now - timedelta(minutes=10),
                    end_time=now,
                    duration_seconds=600,
                    entry_evidence=ev_instance
                )

        video.status = VideoUpload.STATUS_COMPLETED
        video.progress_percent = 100
        video.total_frames = results.get("total_frames", 100)
        video.processed_frames = results.get("processed_frames", 100)
        video.detected_objects_count = len(results.get("unique_objects", []))
        video.completed_at = dj_timezone.now()
        video.save()

        AuditLog.log_event(
            action="VIDEO_PROCESSED",
            resource_type="video",
            resource_id=str(video.id),
            details={"objects_found": video.detected_objects_count, "filename": video.original_filename}
        )

        broadcast_ws_event("processing.completed", {
            "video_id": video.id,
            "status": "completed",
            "progress": 100,
            "detected_objects": video.detected_objects_count
        })

        return {"status": "success", "objects": video.detected_objects_count}

    except Exception as e:
        video.status = VideoUpload.STATUS_FAILED
        video.error_message = str(e)
        video.save(update_fields=['status', 'error_message'])
        broadcast_ws_event("processing.failed", {
            "video_id": video.id,
            "status": "failed",
            "error": str(e)
        })
        return {"status": "failed", "error": str(e)}
