from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import DetectionRecord
from .serializers import DetectionRecordSerializer


class DetectionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DetectionRecord.objects.all().select_related('camera', 'video').order_by('-timestamp')
    serializer_class = DetectionRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        camera = self.request.query_params.get('camera')
        cls_name = self.request.query_params.get('class_name')
        track_id = self.request.query_params.get('track_id')

        if camera:
            qs = qs.filter(camera__camera_id=camera)
        if cls_name:
            qs = qs.filter(class_name__iexact=cls_name)
        if track_id:
            qs = qs.filter(track_id=track_id)

        return qs
