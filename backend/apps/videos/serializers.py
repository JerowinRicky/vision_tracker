import os
from rest_framework import serializers
from .models import VideoUpload


ALLOWED_EXTENSIONS = {'.mp4', '.avi', '.mkv', '.mov'}
MAX_UPLOAD_SIZE = 500 * 1024 * 1024  # 500 MB


class VideoUploadSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = VideoUpload
        fields = [
            'id', 'camera', 'file', 'file_url', 'original_filename',
            'file_size_bytes', 'duration_seconds', 'fps', 'resolution',
            'status', 'progress_percent', 'total_frames', 'processed_frames',
            'detected_objects_count', 'error_message', 'task_id',
            'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'original_filename', 'file_size_bytes', 'duration_seconds', 'fps', 'resolution',
            'status', 'progress_percent', 'total_frames', 'processed_frames',
            'detected_objects_count', 'error_message', 'task_id',
            'created_at', 'updated_at', 'completed_at'
        ]

    def get_file_url(self, obj) -> str:
        if obj.file:
            return obj.file.url
        return ""

    def validate_file(self, value):
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                f"Unsupported video format '{ext}'. Allowed extensions are: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        if value.size > MAX_UPLOAD_SIZE:
            raise serializers.ValidationError(
                f"File size exceeds maximum limit of {MAX_UPLOAD_SIZE // (1024 * 1024)}MB."
            )
        return value

    def create(self, validated_data):
        file = validated_data['file']
        validated_data['original_filename'] = os.path.basename(file.name)
        validated_data['file_size_bytes'] = file.size
        return super().create(validated_data)
