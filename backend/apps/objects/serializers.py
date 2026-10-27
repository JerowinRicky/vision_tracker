from rest_framework import serializers
from .models import PersistentObject, EvidenceImage
from apps.cameras.serializers import CameraSerializer


class EvidenceImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    camera_name = serializers.CharField(source='camera.name', read_only=True)
    camera_id = serializers.CharField(source='camera.camera_id', read_only=True)

    class Meta:
        model = EvidenceImage
        fields = [
            'id', 'persistent_object', 'track_id', 'camera', 'camera_name',
            'camera_id', 'image', 'image_url', 'event_type', 'confidence',
            'similarity_score', 'captured_at', 'metadata_json'
        ]

    def get_image_url(self, obj) -> str:
        if obj.image:
            return obj.image.url
        return ""


class PersistentObjectListSerializer(serializers.ModelSerializer):
    camera_ids = serializers.SerializerMethodField()
    primary_image_url = serializers.SerializerMethodField()

    class Meta:
        model = PersistentObject
        fields = [
            'id', 'internal_id', 'object_type', 'first_seen', 'last_seen',
            'total_visits', 'total_duration_seconds', 'camera_ids',
            'primary_evidence_image', 'primary_image_url', 'notes'
        ]

    def get_camera_ids(self, obj):
        return [c.camera_id for c in obj.cameras.all()]

    def get_primary_image_url(self, obj) -> str:
        if obj.primary_evidence_image:
            img_path = obj.primary_evidence_image.replace('\\', '/')
            if not img_path.startswith('evidence/'):
                img_path = f"evidence/{img_path}"
            return f"/media/{img_path}"
        first_ev = obj.evidence_images.first()
        return first_ev.image.url if first_ev and first_ev.image else ""


class PersistentObjectDetailSerializer(serializers.ModelSerializer):
    cameras = CameraSerializer(many=True, read_only=True)
    evidence_images = EvidenceImageSerializer(many=True, read_only=True)
    visits = serializers.SerializerMethodField()
    primary_image_url = serializers.SerializerMethodField()

    class Meta:
        model = PersistentObject
        fields = [
            'id', 'internal_id', 'object_type', 'first_seen', 'last_seen',
            'total_visits', 'total_duration_seconds', 'cameras',
            'primary_evidence_image', 'primary_image_url', 'notes', 'evidence_images', 'visits'
        ]

    def get_primary_image_url(self, obj) -> str:
        if obj.primary_evidence_image:
            img_path = obj.primary_evidence_image.replace('\\', '/')
            if not img_path.startswith('evidence/'):
                img_path = f"evidence/{img_path}"
            return f"/media/{img_path}"
        first_ev = obj.evidence_images.first()
        return first_ev.image.url if first_ev and first_ev.image else ""

    def get_visits(self, obj):
        from apps.visits.serializers import VisitSerializer
        return VisitSerializer(obj.visits.all().order_by('-start_time'), many=True).data
