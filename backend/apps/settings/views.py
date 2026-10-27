from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import SystemSetting, DEFAULT_SETTINGS
from apps.authentication.permissions import IsAdminRole
from apps.audit.models import AuditLog


class SystemSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Merge defaults with saved DB settings
        saved = {s.key: s.value_json for s in SystemSetting.objects.all()}
        all_settings = {**DEFAULT_SETTINGS, **saved}
        return Response(all_settings)

    def put(self, request):
        if not request.user.is_admin_user():
            return Response({'error': 'Only administrators can modify system settings.'}, status=status.HTTP_403_FORBIDDEN)

        updated = {}
        for key, value in request.data.items():
            # Determine category
            category = "general"
            for cat in ["detection", "tracking", "reid", "evidence", "retention", "alert", "storage", "ui"]:
                if key.startswith(cat):
                    category = cat
                    break
            SystemSetting.set_setting(key, value, category=category)
            updated[key] = value

        AuditLog.log_event(
            action="SETTINGS_UPDATED",
            resource_type="settings",
            details={"keys_updated": list(updated.keys())},
            request=request
        )

        saved = {s.key: s.value_json for s in SystemSetting.objects.all()}
        return Response({**DEFAULT_SETTINGS, **saved})
