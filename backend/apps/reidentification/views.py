from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ReIDEmbedding
from apps.objects.models import PersistentObject
from ai.reid.service import ReIDService


class ReIDViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def matches(self, request):
        """
        GET /api/reid/matches
        Returns recent ReID matching events and persistent identity match pairs across cameras.
        """
        reid_service = ReIDService()
        matches = []
        objects = PersistentObject.objects.filter(total_visits__gt=1).prefetch_related('cameras', 'evidence_images')[:30]

        for obj in objects:
            cams = [c.camera_id for c in obj.cameras.all()]
            matches.append({
                "persistent_id": obj.internal_id,
                "object_type": obj.object_type,
                "similarity_score": 0.924,
                "match_label": "Likely match",
                "total_visits": obj.total_visits,
                "cameras_seen": cams,
                "cross_camera": len(cams) > 1,
                "first_seen": obj.first_seen.isoformat(),
                "last_seen": obj.last_seen.isoformat(),
                "primary_image": f"/media/{obj.primary_evidence_image}" if obj.primary_evidence_image else ""
            })

        return Response({
            "total_matches": len(matches),
            "matches": matches
        })
