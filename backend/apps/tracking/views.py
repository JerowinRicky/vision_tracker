from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import TrackRecord
from .serializers import TrackRecordSerializer


class TrackRecordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TrackRecord.objects.all().select_related('camera', 'video', 'persistent_object').order_by('-last_timestamp')
    serializer_class = TrackRecordSerializer
    permission_classes = [IsAuthenticated]
