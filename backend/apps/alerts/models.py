from django.db import models
from apps.cameras.models import Camera
from apps.zones.models import Zone
from apps.objects.models import PersistentObject


class Alert(models.Model):
    # Priorities
    PRIORITY_LOW = 'LOW'
    PRIORITY_MEDIUM = 'MEDIUM'
    PRIORITY_HIGH = 'HIGH'
    PRIORITY_CRITICAL = 'CRITICAL'

    PRIORITY_CHOICES = [
        (PRIORITY_LOW, 'Low'),
        (PRIORITY_MEDIUM, 'Medium'),
        (PRIORITY_HIGH, 'High'),
        (PRIORITY_CRITICAL, 'Critical'),
    ]

    # Lifecycle Statuses
    STATUS_NEW = 'NEW'
    STATUS_ACKNOWLEDGED = 'ACKNOWLEDGED'
    STATUS_RESOLVED = 'RESOLVED'
    STATUS_DISMISSED = 'DISMISSED'

    STATUS_CHOICES = [
        (STATUS_NEW, 'New'),
        (STATUS_ACKNOWLEDGED, 'Acknowledged'),
        (STATUS_RESOLVED, 'Resolved'),
        (STATUS_DISMISSED, 'Dismissed'),
    ]

    # Legacy severity compatibility
    SEVERITY_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('critical', 'Critical'),
    ]

    camera = models.ForeignKey(Camera, on_delete=models.SET_NULL, null=True, blank=True, related_name='alerts')
    zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True, blank=True, related_name='alerts')
    persistent_object = models.ForeignKey(PersistentObject, on_delete=models.SET_NULL, null=True, blank=True, related_name='alerts')

    alert_type = models.CharField(max_length=60, db_index=True)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='warning')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default=PRIORITY_MEDIUM, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_NEW, db_index=True)

    title = models.CharField(max_length=200)
    message = models.TextField()

    track_id = models.IntegerField(null=True, blank=True)
    object_type = models.CharField(max_length=50, blank=True, null=True)
    evidence_image = models.CharField(max_length=500, blank=True, null=True)

    is_read = models.BooleanField(default=False)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'alerts'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.priority}] {self.title} ({self.status}) - {self.created_at}"


class AlertRule(models.Model):
    RULE_PERSON_RESTRICTED = 'PERSON_IN_RESTRICTED_ZONE'
    RULE_VEHICLE_RESTRICTED = 'VEHICLE_IN_RESTRICTED_ZONE'
    RULE_OBJECT_LOITERING = 'OBJECT_LOITERING'
    RULE_HIGH_OBJECT_COUNT = 'HIGH_OBJECT_COUNT'
    RULE_CAMERA_OFFLINE = 'CAMERA_OFFLINE'
    RULE_REID_MATCH = 'REIDENTIFICATION_MATCH'

    RULE_TYPE_CHOICES = [
        (RULE_PERSON_RESTRICTED, 'Person in Restricted Zone'),
        (RULE_VEHICLE_RESTRICTED, 'Vehicle in Restricted Zone'),
        (RULE_OBJECT_LOITERING, 'Object Loitering'),
        (RULE_HIGH_OBJECT_COUNT, 'High Object Count'),
        (RULE_CAMERA_OFFLINE, 'Camera Offline'),
        (RULE_REID_MATCH, 'Re-Identification Match'),
    ]

    name = models.CharField(max_length=150)
    rule_type = models.CharField(max_length=60, choices=RULE_TYPE_CHOICES, db_index=True)
    camera = models.ForeignKey(Camera, on_delete=models.CASCADE, null=True, blank=True, related_name='alert_rules')
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, null=True, blank=True, related_name='alert_rules')
    target_classes = models.JSONField(default=list, blank=True)
    dwell_threshold_seconds = models.IntegerField(default=30)
    occupancy_threshold = models.IntegerField(default=5)
    priority = models.CharField(max_length=20, choices=Alert.PRIORITY_CHOICES, default=Alert.PRIORITY_HIGH)
    is_active = models.BooleanField(default=True)
    cooldown_seconds = models.IntegerField(default=60)
    last_triggered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'alert_rules'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.rule_type}) [{self.priority}]"
