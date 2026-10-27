from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Visit
from .serializers import VisitSerializer


class VisitViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Visit.objects.all().select_related('persistent_object', 'camera', 'entry_evidence').order_by('-start_time')
    serializer_class = VisitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        persistent_id = self.request.query_params.get('persistent_id')
        camera_id = self.request.query_params.get('camera')
        date = self.request.query_params.get('date')

        if persistent_id:
            qs = qs.filter(persistent_object__internal_id__icontains=persistent_id)
        if camera_id:
            qs = qs.filter(camera__camera_id=camera_id)
        if date:
            qs = qs.filter(start_time__date=date)

        return qs
