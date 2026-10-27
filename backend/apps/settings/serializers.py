from rest_framework import serializers
from .models import SystemSetting, DEFAULT_SETTINGS


class SystemSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSetting
        fields = ['id', 'category', 'key', 'value_json', 'description', 'updated_at']
