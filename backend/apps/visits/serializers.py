from rest_framework import serializers
from .models import Visit
from apps.objects.models import EvidenceImage


class VisitSerializer(serializers.ModelSerializer):
    persistent_id = serializers.CharField(source='persistent_object.internal_id', read_only=True)
    object_type = serializers.CharField(source='persistent_object.object_type', read_only=True)
    camera_id = serializers.CharField(source='camera.camera_id', read_only=True)
    camera_name = serializers.CharField(source='camera.name', read_only=True)
    entry_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Visit
        fields = [
            'id', 'persistent_object', 'persistent_id', 'object_type',
            'camera', 'camera_id', 'camera_name', 'visit_number',
            'start_time', 'end_time', 'duration_seconds',
            'entry_evidence', 'entry_image_url', 'created_at'
        ]

    def get_entry_image_url(self, obj) -> str:
        if obj.entry_evidence and obj.entry_evidence.image:
            return obj.entry_evidence.image.url
        return ""
