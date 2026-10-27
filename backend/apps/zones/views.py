from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Zone
from .serializers import ZoneSerializer
from apps.authentication.permissions import IsOperatorOrAdmin
from apps.audit.models import AuditLog


class ZoneViewSet(viewsets.ModelViewSet):
    queryset = Zone.objects.all().select_related('camera').order_by('name')
    serializer_class = ZoneSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsOperatorOrAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        zone = serializer.save()
        AuditLog.log_event(
            action="ZONE_CREATED",
            resource_type="zone",
            resource_id=str(zone.id),
            details={"name": zone.name, "camera": zone.camera.camera_id},
            request=self.request
        )

    def perform_update(self, serializer):
        zone = serializer.save()
        AuditLog.log_event(
            action="ZONE_UPDATED",
            resource_type="zone",
            resource_id=str(zone.id),
            details={"name": zone.name},
            request=self.request
        )
