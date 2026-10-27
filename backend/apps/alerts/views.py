from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Alert, AlertRule
from .serializers import AlertSerializer, AlertRuleSerializer


class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all().select_related('camera', 'zone', 'persistent_object').order_by('-created_at')
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        is_read = self.request.query_params.get('is_read')
        severity = self.request.query_params.get('severity')
        priority = self.request.query_params.get('priority')
        status_val = self.request.query_params.get('status')
        camera = self.request.query_params.get('camera')

        if is_read is not None:
            qs = qs.filter(is_read=is_read.lower() in ('true', '1'))
        if severity:
            qs = qs.filter(severity=severity.lower())
        if priority:
            qs = qs.filter(priority=priority.upper())
        if status_val:
            qs = qs.filter(status=status_val.upper())
        if camera:
            qs = qs.filter(camera__camera_id=camera)

        return qs

    @action(detail=True, methods=['put', 'post'])
    def read(self, request, pk=None):
        alert = self.get_object()
        alert.is_read = True
        alert.save(update_fields=['is_read'])
        return Response({'status': 'marked_as_read', 'id': alert.id})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Alert.objects.filter(is_read=False).update(is_read=True)
        return Response({'status': 'all_marked_as_read'})

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        alert = self.get_object()
        alert.status = Alert.STATUS_ACKNOWLEDGED
        alert.acknowledged_at = timezone.now()
        alert.is_read = True
        alert.save(update_fields=['status', 'acknowledged_at', 'is_read'])
        return Response({
            'status': 'acknowledged',
            'id': alert.id,
            'acknowledged_at': alert.acknowledged_at
        })

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        alert.status = Alert.STATUS_RESOLVED
        alert.resolved_at = timezone.now()
        alert.is_read = True
        alert.save(update_fields=['status', 'resolved_at', 'is_read'])
        return Response({
            'status': 'resolved',
            'id': alert.id,
            'resolved_at': alert.resolved_at
        })

    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        alert = self.get_object()
        alert.status = Alert.STATUS_DISMISSED
        alert.is_read = True
        alert.save(update_fields=['status', 'is_read'])
        return Response({
            'status': 'dismissed',
            'id': alert.id
        })


class AlertRuleViewSet(viewsets.ModelViewSet):
    queryset = AlertRule.objects.all().select_related('camera', 'zone').order_by('-created_at')
    serializer_class = AlertRuleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        rule_type = self.request.query_params.get('rule_type')
        is_active = self.request.query_params.get('is_active')
        if rule_type:
            qs = qs.filter(rule_type=rule_type)
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() in ('true', '1'))
        return qs
