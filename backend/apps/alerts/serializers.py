from rest_framework import serializers
from .models import Alert, AlertRule


class AlertSerializer(serializers.ModelSerializer):
    camera_name = serializers.CharField(source='camera.name', read_only=True)
    camera_id = serializers.CharField(source='camera.camera_id', read_only=True)
    zone_name = serializers.CharField(source='zone.name', read_only=True)
    persistent_id = serializers.CharField(source='persistent_object.internal_id', read_only=True)

    class Meta:
        model = Alert
        fields = [
            'id', 'camera', 'camera_name', 'camera_id', 'zone', 'zone_name',
            'persistent_object', 'persistent_id', 'alert_type', 'severity',
            'priority', 'status', 'title', 'message', 'track_id', 'object_type',
            'evidence_image', 'is_read', 'acknowledged_at', 'resolved_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AlertRuleSerializer(serializers.ModelSerializer):
    camera_name = serializers.CharField(source='camera.name', read_only=True)
    zone_name = serializers.CharField(source='zone.name', read_only=True)

    class Meta:
        model = AlertRule
        fields = [
            'id', 'name', 'rule_type', 'camera', 'camera_name', 'zone',
            'zone_name', 'target_classes', 'dwell_threshold_seconds',
            'occupancy_threshold', 'priority', 'is_active', 'cooldown_seconds',
            'last_triggered_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'last_triggered_at', 'created_at', 'updated_at']
