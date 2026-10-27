import os
import uuid
from django.db import models
from apps.cameras.models import Camera


def get_secure_video_upload_path(instance, filename):
    ext = os.path.splitext(filename)[1].lower()
    safe_name = f"{uuid.uuid4().hex}{ext}"
    return os.path.join('videos', safe_name)


class VideoUpload(models.Model):
    STATUS_UPLOADED = 'uploaded'
    STATUS_QUEUED = 'queued'
    STATUS_PROCESSING = 'processing'
    STATUS_COMPLETED = 'completed'
    STATUS_FAILED = 'failed'
    STATUS_PAUSED = 'paused'
    STATUS_CANCELLED = 'cancelled'

    STATUS_CHOICES = [
        (STATUS_UPLOADED, 'Uploaded'),
        (STATUS_QUEUED, 'Queued'),
        (STATUS_PROCESSING, 'Processing'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_FAILED, 'Failed'),
        (STATUS_PAUSED, 'Paused'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    camera = models.ForeignKey(Camera, on_delete=models.SET_NULL, null=True, blank=True, related_name='recorded_videos')
    file = models.FileField(upload_to=get_secure_video_upload_path)
    original_filename = models.CharField(max_length=255, blank=True, default="")
    file_size_bytes = models.BigIntegerField(default=0)
    duration_seconds = models.FloatField(default=0.0)
    fps = models.FloatField(default=30.0)
    resolution = models.CharField(max_length=50, blank=True, default="1920x1080")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_UPLOADED)
    progress_percent = models.IntegerField(default=0)
    total_frames = models.IntegerField(default=0)
    processed_frames = models.IntegerField(default=0)
    detected_objects_count = models.IntegerField(default=0)

    error_message = models.TextField(blank=True, null=True)
    task_id = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'video_uploads'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.original_filename} ({self.status} - {self.progress_percent}%)"
