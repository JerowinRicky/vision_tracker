from django.db import models
from apps.cameras.models import Camera
from apps.objects.models import PersistentObject


class Zone(models.Model):
    ZONE_RESTRICTED = 'restricted'
    ZONE_ENTRANCE = 'entrance'
    ZONE_PARKING = 'parking'
    ZONE_RECEPTION = 'reception'
    ZONE_WAREHOUSE = 'warehouse'
    ZONE_CUSTOM = 'custom'

    ZONE_TYPES = [
        (ZONE_RESTRICTED, 'Restricted Area'),
        (ZONE_ENTRANCE, 'Entrance'),
        (ZONE_PARKING, 'Parking'),
        (ZONE_RECEPTION, 'Reception'),
        (ZONE_WAREHOUSE, 'Warehouse'),
        (ZONE_CUSTOM, 'Custom Zone'),
    ]

    camera = models.ForeignKey(Camera, on_delete=models.CASCADE, related_name='zones')
    name = models.CharField(max_length=100)
    zone_type = models.CharField(max_length=50, choices=ZONE_TYPES, default=ZONE_CUSTOM)
    polygon_points = models.JSONField(help_text="Array of point dicts: [{'x': 100, 'y': 200}, ...]")

    rules = models.JSONField(
        default=list,
        help_text="Active rules e.g. ['person_entry', 'vehicle_entry', 'dwell_time', 'occupancy']"
    )
    max_dwell_seconds = models.PositiveIntegerField(default=60)
    max_occupancy = models.PositiveIntegerField(default=5)
    color_hex = models.CharField(max_length=20, default="#EF4444")
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'zones'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.camera.camera_id})"


class ZoneEvent(models.Model):
    EVENT_ENTER = 'enter'
    EVENT_EXIT = 'exit'
    EVENT_DWELL = 'dwell_exceeded'
    EVENT_OCCUPANCY = 'occupancy_exceeded'

    EVENT_CHOICES = [
        (EVENT_ENTER, 'Zone Entry'),
        (EVENT_EXIT, 'Zone Exit'),
        (EVENT_DWELL, 'Dwell Time Exceeded'),
        (EVENT_OCCUPANCY, 'Occupancy Exceeded'),
    ]

    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name='events')
    camera = models.ForeignKey(Camera, on_delete=models.CASCADE, related_name='zone_events')
    persistent_object = models.ForeignKey(PersistentObject, on_delete=models.SET_NULL, null=True, blank=True, related_name='zone_events')
    track_id = models.IntegerField(null=True, blank=True)
    object_type = models.CharField(max_length=50, default="person")
    event_type = models.CharField(max_length=30, choices=EVENT_CHOICES, default=EVENT_ENTER)
    duration_seconds = models.FloatField(default=0.0)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'zone_events'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.zone.name} - {self.event_type} by {self.object_type} #{self.track_id}"
