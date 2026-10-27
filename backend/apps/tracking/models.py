from django.db import models
from apps.cameras.models import Camera
from apps.videos.models import VideoUpload
from apps.objects.models import PersistentObject


class TrackRecord(models.Model):
    camera = models.ForeignKey(Camera, on_delete=models.SET_NULL, null=True, blank=True, related_name='tracks')
    video = models.ForeignKey(VideoUpload, on_delete=models.CASCADE, null=True, blank=True, related_name='tracks')
    persistent_object = models.ForeignKey(PersistentObject, on_delete=models.SET_NULL, null=True, blank=True, related_name='tracks')

    track_id = models.IntegerField(db_index=True)
    class_name = models.CharField(max_length=50)

    first_frame = models.IntegerField(default=0)
    last_frame = models.IntegerField(default=0)
    first_timestamp = models.DateTimeField(db_index=True)
    last_timestamp = models.DateTimeField(db_index=True)

    avg_confidence = models.FloatField(default=0.0)
    movement_path = models.JSONField(default=list, help_text="List of [x, y] coordinates")

    class Meta:
        db_table = 'tracks'
        ordering = ['-last_timestamp']

    def __str__(self):
        return f"Track #{self.track_id} ({self.class_name})"
