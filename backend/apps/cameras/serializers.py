from rest_framework import serializers
from .models import Camera


class CameraSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    has_credentials = serializers.SerializerMethodField()

    class Meta:
        model = Camera
        fields = [
            'id', 'name', 'camera_id', 'stream_type', 'stream_url',
            'username', 'password', 'has_credentials', 'resolution',
            'fps', 'processing_fps', 'detection_model', 'confidence_threshold',
            'tracking_algorithm', 'is_enabled', 'status', 'last_ping',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'last_ping', 'created_at', 'updated_at']

    def get_has_credentials(self, obj) -> bool:
        return bool(obj.encrypted_password)

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        camera = Camera.objects.create(**validated_data)
        if password:
            camera.set_password(password)
            camera.save()
        return camera

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
