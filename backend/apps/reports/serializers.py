import os
from rest_framework import serializers
from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            'id', 'report_type', 'title', 'start_date', 'end_date',
            'file_format', 'filters_applied', 'summary_data', 'file_path',
            'file_url', 'status', 'error_message', 'created_at'
        ]
        read_only_fields = ['id', 'file_path', 'status', 'error_message', 'created_at']

    def get_file_url(self, obj) -> str:
        if obj.file_path:
            return f"/media/reports/{os.path.basename(obj.file_path)}"
        return ""
