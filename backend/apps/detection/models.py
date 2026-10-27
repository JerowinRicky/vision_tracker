from django.db import models
from apps.cameras.models import Camera
from apps.videos.models import VideoUpload


class DetectionRecord(models.Model):
    camera = models.ForeignKey(Camera, on_delete=models.SET_NULL, null=True, blank=True, related_name='detections')
    video = models.ForeignKey(VideoUpload, on_delete=models.CASCADE, null=True, blank=True, related_name='detections')

    track_id = models.IntegerField(db_index=True)
    class_name = models.CharField(max_length=50, db_index=True)
    confidence = models.FloatField()

    # Bounding box
    bbox_x = models.IntegerField()
    bbox_y = models.IntegerField()
    bbox_width = models.IntegerField()
    bbox_height = models.IntegerField()

    frame_number = models.IntegerField(default=0)
    timestamp = models.DateTimeField(db_index=True)

    class Meta:
        db_table = 'detections'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp', 'class_name']),
            models.Index(fields=['camera', 'timestamp']),
            models.Index(fields=['track_id']),
        ]

    def __str__(self):
        return f"{self.class_name} #{self.track_id} ({self.confidence:.2f})"
