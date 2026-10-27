from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import AuditLog
from .serializers import AuditLogSerializer
from apps.authentication.permissions import IsAdminRole


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        qs = super().get_queryset()
        action = self.request.query_params.get('action')
        resource = self.request.query_params.get('resource_type')
        user = self.request.query_params.get('username')

        if action:
            qs = qs.filter(action__icontains=action)
        if resource:
            qs = qs.filter(resource_type=resource)
        if user:
            qs = qs.filter(username__icontains=user)

        return qs
