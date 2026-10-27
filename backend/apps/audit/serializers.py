from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'username', 'action', 'resource_type',
            'resource_id', 'details', 'ip_address', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']
