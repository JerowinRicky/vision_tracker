import threading
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import VideoUpload
from .serializers import VideoUploadSerializer
from apps.authentication.permissions import IsOperatorOrAdmin
from apps.audit.models import AuditLog
from workers.tasks.video_tasks import process_video_task


class VideoUploadViewSet(viewsets.ModelViewSet):
    queryset = VideoUpload.objects.all().order_by('-created_at')
    serializer_class = VideoUploadSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        video = serializer.save()
        AuditLog.log_event(
            action="VIDEO_UPLOADED",
            resource_type="video",
            resource_id=str(video.id),
            details={"filename": video.original_filename, "size": video.file_size_bytes},
            request=self.request
        )

    @action(detail=True, methods=['post'], permission_classes=[IsOperatorOrAdmin])
    def process(self, request, pk=None):
        video = self.get_object()

        if video.status == VideoUpload.STATUS_PROCESSING:
            return Response({'error': 'Video is already being processed.'}, status=status.HTTP_400_BAD_REQUEST)

        video.status = VideoUpload.STATUS_QUEUED
        video.progress_percent = 0
        video.error_message = None
        video.save()

        # Asynchronous execution via Celery or threaded fallback
        job_id = f"job-{video.id}"
        try:
            res = process_video_task.delay(video.id)
            job_id = res.id
        except Exception:
            # Thread fallback when Redis/Celery broker is not running
            t = threading.Thread(target=process_video_task, args=(video.id,))
            t.daemon = True
            t.start()

        AuditLog.log_event(
            action="VIDEO_PROCESSING_STARTED",
            resource_type="video",
            resource_id=str(video.id),
            details={"job_id": job_id},
            request=request
        )

        return Response({
            'job_id': job_id,
            'status': 'queued',
            'video_id': video.id,
            'message': 'Video processing queued successfully.'
        }, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=['post'], permission_classes=[IsOperatorOrAdmin])
    def pause(self, request, pk=None):
        video = self.get_object()
        video.status = VideoUpload.STATUS_PAUSED
        video.save()
        return Response({'status': video.status})

    @action(detail=True, methods=['post'], permission_classes=[IsOperatorOrAdmin])
    def resume(self, request, pk=None):
        video = self.get_object()
        video.status = VideoUpload.STATUS_QUEUED
        video.save()
        # Resume job
        t = threading.Thread(target=process_video_task, args=(video.id,))
        t.daemon = True
        t.start()
        return Response({'status': video.status})

    @action(detail=True, methods=['post'], permission_classes=[IsOperatorOrAdmin])
    def cancel(self, request, pk=None):
        video = self.get_object()
        video.status = VideoUpload.STATUS_CANCELLED
        video.save()
        return Response({'status': video.status})

    @action(detail=True, methods=['get'])
    def job_status(self, request, pk=None):
        video = self.get_object()
        return Response({
            'video_id': video.id,
            'status': video.status,
            'progress_percent': video.progress_percent,
            'processed_frames': video.processed_frames,
            'total_frames': video.total_frames,
            'detected_objects_count': video.detected_objects_count,
            'error_message': video.error_message
        })
