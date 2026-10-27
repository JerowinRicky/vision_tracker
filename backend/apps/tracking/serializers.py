from rest_framework import serializers
from .models import TrackRecord


class TrackRecordSerializer(serializers.ModelSerializer):
    persistent_id = serializers.CharField(source='persistent_object.internal_id', read_only=True)
    camera_id = serializers.CharField(source='camera.camera_id', read_only=True)

    class Meta:
        model = TrackRecord
        fields = [
            'id', 'camera', 'camera_id', 'video', 'persistent_object',
            'persistent_id', 'track_id', 'class_name', 'first_frame',
            'last_frame', 'first_timestamp', 'last_timestamp',
            'avg_confidence', 'movement_path'
        ]
