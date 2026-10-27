from rest_framework import serializers
from .models import DetectionRecord


class DetectionRecordSerializer(serializers.ModelSerializer):
    camera_id = serializers.CharField(source='camera.camera_id', read_only=True)
    video_filename = serializers.CharField(source='video.original_filename', read_only=True)

    class Meta:
        model = DetectionRecord
        fields = [
            'id', 'camera', 'camera_id', 'video', 'video_filename',
            'track_id', 'class_name', 'confidence',
            'bbox_x', 'bbox_y', 'bbox_width', 'bbox_height',
            'frame_number', 'timestamp'
        ]
