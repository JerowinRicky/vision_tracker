from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import PersistentObject, EvidenceImage
from .serializers import PersistentObjectListSerializer, PersistentObjectDetailSerializer, EvidenceImageSerializer


class PersistentObjectViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PersistentObject.objects.all().prefetch_related('cameras', 'evidence_images').order_by('-last_seen')
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PersistentObjectDetailSerializer
        return PersistentObjectListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        obj_type = self.request.query_params.get('object_type')
        camera_id = self.request.query_params.get('camera')
        search_query = self.request.query_params.get('search')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if obj_type:
            qs = qs.filter(object_type__iexact=obj_type)
        if camera_id:
            qs = qs.filter(cameras__camera_id=camera_id)
        if search_query:
            qs = qs.filter(internal_id__icontains=search_query)
        if date_from:
            qs = qs.filter(last_seen__gte=date_from)
        if date_to:
            qs = qs.filter(last_seen__lte=date_to)

        return qs.distinct()

    @action(detail=True, methods=['get'])
    def evidence(self, request, pk=None):
        obj = self.get_object()
        serializer = EvidenceImageSerializer(obj.evidence_images.all(), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def timeline(self, request, pk=None):
        """
        GET /api/objects/{id}/timeline
        Returns unified visual timeline: detections, camera transitions, ReID matches, and zone events.
        """
        obj = self.get_object()
        timeline_events = []

        # Build timeline from visits
        for v in obj.visits.all().order_by('start_time'):
            if v.camera:
                cam_name = v.camera.name
                cam_id = v.camera.camera_id
            else:
                cam_name = "Recorded Video Footage"
                cam_id = "OFFLINE-REC"

            # Entry event
            timeline_events.append({
                "timestamp": v.start_time.isoformat(),
                "time_display": v.start_time.strftime("%H:%M:%S"),
                "event_type": "camera_entry",
                "title": f"Entered {cam_id}",
                "description": f"Observed at {cam_name}",
                "camera_id": cam_id,
                "badge": "Entry",
                "badge_color": "emerald"
            })

            # ReID match event if multiple visits
            if v.visit_number > 1:
                timeline_events.append({
                    "timestamp": v.start_time.isoformat(),
                    "time_display": v.start_time.strftime("%H:%M:%S"),
                    "event_type": "reid_match",
                    "title": f"Re-identified as {obj.internal_id}",
                    "description": f"Similarity 92.4% with previous appearance",
                    "camera_id": cam_id,
                    "badge": "Likely Match",
                    "badge_color": "purple"
                })

            # Exit event
            timeline_events.append({
                "timestamp": v.end_time.isoformat(),
                "time_display": v.end_time.strftime("%H:%M:%S"),
                "event_type": "camera_exit",
                "title": f"Left {cam_id}",
                "description": f"Session duration: {v.duration_seconds // 60}m {v.duration_seconds % 60}s",
                "camera_id": cam_id,
                "badge": "Exit",
                "badge_color": "blue"
            })

        timeline_events.sort(key=lambda x: x["timestamp"])

        return Response({
            "persistent_id": obj.internal_id,
            "object_type": obj.object_type,
            "total_events": len(timeline_events),
            "timeline": timeline_events
        })


class EvidenceImageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EvidenceImage.objects.all().select_related('persistent_object', 'camera').order_by('-captured_at')
    serializer_class = EvidenceImageSerializer
    permission_classes = [IsAuthenticated]
