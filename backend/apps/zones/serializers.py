from rest_framework import serializers
from .models import Zone, ZoneEvent


class ZoneEventSerializer(serializers.ModelSerializer):
    zone_name = serializers.CharField(source='zone.name', read_only=True)
    camera_id = serializers.CharField(source='camera.camera_id', read_only=True)
    persistent_id = serializers.CharField(source='persistent_object.internal_id', read_only=True)

    class Meta:
        model = ZoneEvent
        fields = [
            'id', 'zone', 'zone_name', 'camera', 'camera_id',
            'persistent_object', 'persistent_id', 'track_id',
            'object_type', 'event_type', 'duration_seconds', 'timestamp'
        ]


class ZoneSerializer(serializers.ModelSerializer):
    camera_name = serializers.CharField(source='camera.name', read_only=True)
    camera_id = serializers.CharField(source='camera.camera_id', read_only=True)
    events_count = serializers.SerializerMethodField()

    class Meta:
        model = Zone
        fields = [
            'id', 'camera', 'camera_name', 'camera_id', 'name',
            'zone_type', 'polygon_points', 'rules', 'max_dwell_seconds',
            'max_occupancy', 'color_hex', 'is_active', 'events_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_events_count(self, obj) -> int:
        return obj.events.count()
