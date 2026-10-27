from django.db import models


DEFAULT_SETTINGS = {
    # Detection
    "detection_model": "yolov8n",
    "detection_confidence_threshold": 0.50,
    "detection_iou_threshold": 0.45,
    "detection_classes": ["person", "car", "motorcycle", "bus", "truck", "bicycle", "dog", "cat", "bird"],
    "detection_image_size": 640,
    "detection_processing_fps": 10,
    "detection_device": "cpu",
    "detection_interval": 1,

    # Tracking
    "tracking_algorithm": "bytetrack",
    "tracking_timeout": 30,
    "tracking_min_confidence": 0.3,
    "tracking_max_lost_frames": 30,
    "tracking_persistence": True,

    # ReID
    "reid_enabled": True,
    "reid_similarity_threshold": 0.85,
    "reid_embedding_model": "osnet_x0_25",
    "reid_matching_window_minutes": 1440,
    "reid_min_crop_quality": 0.70,

    # Evidence
    "evidence_capture_first": True,
    "evidence_capture_highest_conf": True,
    "evidence_capture_entry": True,
    "evidence_capture_exit": True,
    "evidence_jpeg_quality": 85,
    "evidence_max_per_object": 10,

    # Retention
    "retention_raw_videos_days": 7,
    "retention_evidence_days": 90,
    "retention_tracking_data_days": 180,
    "retention_reports_days": 365,

    # Alerts
    "alerts_enabled": True,
    "alert_dwell_time_default_sec": 60,
    "alert_notify_dashboard": True,
    "alert_notify_webhook": False,
    "alert_webhook_url": "",

    # Storage
    "storage_max_gb": 500,
    "storage_cleanup_policy": "oldest_first",

    # UI
    "ui_theme": "dark",
    "ui_dashboard_refresh_interval_sec": 5,
    "ui_timezone": "UTC",
    "ui_date_format": "YYYY-MM-DD",
}


class SystemSetting(models.Model):
    category = models.CharField(max_length=50, db_index=True)  # detection, tracking, reid, retention, etc.
    key = models.CharField(max_length=100, unique=True, db_index=True)
    value_json = models.JSONField()
    description = models.CharField(max_length=255, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'system_settings'
        ordering = ['category', 'key']

    def __str__(self):
        return f"{self.key}: {self.value_json}"

    @classmethod
    def get_setting(cls, key: str, default=None):
        try:
            return cls.objects.get(key=key).value_json
        except cls.DoesNotExist:
            return default if default is not None else DEFAULT_SETTINGS.get(key)

    @classmethod
    def set_setting(cls, key: str, value, category: str = "general"):
        obj, _ = cls.objects.update_or_create(
            key=key,
            defaults={"value_json": value, "category": category}
        )
        return obj
