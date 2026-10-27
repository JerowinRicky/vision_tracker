import os
import uuid
from django.db import models
from apps.cameras.models import Camera


def get_evidence_image_path(instance, filename):
    ext = os.path.splitext(filename)[1].lower() or '.jpg'
    safe_name = f"ev_{uuid.uuid4().hex}{ext}"
    return os.path.join('evidence', safe_name)


class PersistentObject(models.Model):
    internal_id = models.CharField(max_length=50, unique=True, db_index=True, help_text="e.g. Person #0042")
    object_type = models.CharField(max_length=50, db_index=True, help_text="person, car, dog, etc.")

    first_seen = models.DateTimeField(db_index=True)
    last_seen = models.DateTimeField(db_index=True)
    total_visits = models.PositiveIntegerField(default=1)
    total_duration_seconds = models.PositiveIntegerField(default=0)

    cameras = models.ManyToManyField(Camera, blank=True, related_name='detected_persistent_objects')
    primary_evidence_image = models.CharField(max_length=500, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'persistent_objects'
        ordering = ['-last_seen']

    def __str__(self):
        return f"{self.internal_id} ({self.object_type})"


class EvidenceImage(models.Model):
    EVENT_FIRST_APPEARANCE = 'first_appearance'
    EVENT_BEST_QUALITY = 'best_quality'
    EVENT_HIGHEST_CONFIDENCE = 'highest_confidence'
    EVENT_REID_MATCH = 'reid_match'
    EVENT_ENTRY = 'entry'
    EVENT_EXIT = 'exit'
    EVENT_ZONE_VIOLATION = 'zone_violation'
    EVENT_ALERT = 'alert'

    EVENT_CHOICES = [
        (EVENT_FIRST_APPEARANCE, 'First Appearance'),
        (EVENT_BEST_QUALITY, 'Best Quality'),
        (EVENT_HIGHEST_CONFIDENCE, 'Highest Confidence'),
        (EVENT_REID_MATCH, 'Re-ID Match'),
        (EVENT_ENTRY, 'Zone Entry'),
        (EVENT_EXIT, 'Zone Exit'),
        (EVENT_ZONE_VIOLATION, 'Zone Violation'),
        (EVENT_ALERT, 'Alert Trigger'),
    ]

    persistent_object = models.ForeignKey(PersistentObject, on_delete=models.CASCADE, related_name='evidence_images')
    track_id = models.IntegerField(null=True, blank=True)
    camera = models.ForeignKey(Camera, on_delete=models.SET_NULL, null=True, blank=True, related_name='evidence_images')
    image = models.ImageField(upload_to=get_evidence_image_path)
    event_type = models.CharField(max_length=50, choices=EVENT_CHOICES, default=EVENT_FIRST_APPEARANCE)
    confidence = models.FloatField(default=0.0)
    similarity_score = models.FloatField(default=0.0)
    captured_at = models.DateTimeField(db_index=True)
    metadata_json = models.JSONField(blank=True, default=dict)

    class Meta:
        db_table = 'evidence_images'
        ordering = ['-captured_at']

    def __str__(self):
        return f"Evidence for {self.persistent_object.internal_id} ({self.event_type})"
