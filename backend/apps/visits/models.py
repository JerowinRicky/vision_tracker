from django.db import models
from apps.objects.models import PersistentObject, EvidenceImage
from apps.cameras.models import Camera


class Visit(models.Model):
    persistent_object = models.ForeignKey(PersistentObject, on_delete=models.CASCADE, related_name='visits')
    camera = models.ForeignKey(Camera, on_delete=models.SET_NULL, null=True, blank=True, related_name='visits')

    visit_number = models.PositiveIntegerField(default=1)
    start_time = models.DateTimeField(db_index=True)
    end_time = models.DateTimeField(db_index=True)
    duration_seconds = models.PositiveIntegerField(default=0)

    entry_evidence = models.ForeignKey(EvidenceImage, on_delete=models.SET_NULL, null=True, blank=True, related_name='entry_visits')
    exit_evidence = models.ForeignKey(EvidenceImage, on_delete=models.SET_NULL, null=True, blank=True, related_name='exit_visits')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'visits'
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['persistent_object', 'start_time']),
            models.Index(fields=['start_time', 'end_time']),
        ]

    def __str__(self):
        return f"{self.persistent_object.internal_id} - Visit #{self.visit_number} ({self.duration_seconds}s)"
