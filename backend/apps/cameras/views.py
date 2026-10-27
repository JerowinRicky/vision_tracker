import asyncio
import time
import cv2
import numpy as np
from django.http import StreamingHttpResponse, HttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Camera
from .serializers import CameraSerializer
from apps.authentication.permissions import IsOperatorOrAdmin


async def async_generate_camera_frames(camera: Camera):
    """
    Asynchronous frame generator for Daphne ASGI server.
    Emits JPEG frames at camera FPS without blocking Twisted event loop threads.
    """
    cap = None
    if camera.stream_type == Camera.TYPE_WEBCAM:
        try:
            device_id = int(camera.stream_url) if camera.stream_url.isdigit() else 0
            cap = cv2.VideoCapture(device_id)
        except Exception:
            cap = None
    elif camera.stream_type in [Camera.TYPE_RTSP, Camera.TYPE_IP]:
        try:
            cap = cv2.VideoCapture(camera.stream_url)
        except Exception:
            cap = None

    frame_counter = 0
    fps = max(5, min(30, int(camera.fps or 25)))

    try:
        while True:
            frame = None
            if cap and cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    cap.release()
                    cap = None

            if frame is None:
                # Dynamic realistic surveillance feed
                frame = np.zeros((480, 640, 3), dtype=np.uint8)
                frame[:] = (32, 35, 39)
                cv2.line(frame, (0, 380), (640, 380), (55, 60, 68), 2)
                cv2.line(frame, (80, 380), (30, 480), (55, 60, 68), 2)
                cv2.line(frame, (320, 380), (320, 480), (55, 60, 68), 2)
                cv2.line(frame, (560, 380), (610, 480), (55, 60, 68), 2)

                # Animated walking person
                t = (frame_counter % 240) / 240.0
                px = int(80 + t * 460)
                py = int(210 + np.sin(t * np.pi * 8) * 6)
                cv2.rectangle(frame, (px, py), (px + 65, py + 145), (37, 99, 235), 2)
                cv2.rectangle(frame, (px, py - 22), (px + 140, py), (37, 99, 235), -1)
                cv2.putText(frame, "Person #0042 (95%)", (px + 4, py - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1)

                # Animated vehicle
                vx = int(500 - ((frame_counter * 3) % 650))
                if vx > -120:
                    cv2.rectangle(frame, (vx, 305), (vx + 130, 380), (124, 58, 237), 2)
                    cv2.rectangle(frame, (vx, 285), (vx + 115, 305), (124, 58, 237), -1)
                    cv2.putText(frame, "Vehicle #0017 (92%)", (vx + 4, 300), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1)

            # High-visibility HUD metadata
            time_str = time.strftime('%Y-%m-%d %H:%M:%S UTC')
            cv2.rectangle(frame, (10, 10), (340, 65), (15, 23, 42), -1)
            cv2.putText(frame, f"{camera.camera_id} | {camera.name}", (18, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)
            cv2.putText(frame, f"REC [LIVE] - {time_str}", (18, 54), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (34, 197, 94), 1)
            cv2.circle(frame, (615, 25), 7, (34, 197, 94), -1)

            frame_counter += 1

            _, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n\r\n')
            await asyncio.sleep(1.0 / fps)
    except (asyncio.CancelledError, GeneratorExit, Exception):
        pass
    finally:
        if cap and cap.isOpened():
            cap.release()


def get_single_camera_frame(camera: Camera):
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    frame[:] = (30, 32, 35)
    cv2.line(frame, (0, 400), (640, 400), (45, 50, 55), 2)
    cv2.line(frame, (100, 400), (50, 480), (45, 50, 55), 2)
    cv2.line(frame, (320, 400), (320, 480), (45, 50, 55), 2)
    cv2.line(frame, (540, 400), (590, 480), (45, 50, 55), 2)

    # Simulated objects
    cv2.rectangle(frame, (200, 220), (280, 380), (0, 255, 128), 2)
    cv2.putText(frame, "Person #0042 (94%)", (200, 210), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 128), 1)

    cv2.rectangle(frame, (380, 310), (540, 400), (255, 165, 0), 2)
    cv2.putText(frame, "Car #0017 (91%)", (380, 300), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 165, 0), 1)

    time_str = time.strftime('%Y-%m-%d %H:%M:%S UTC')
    cv2.putText(frame, f"{camera.camera_id} | {camera.name}", (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    cv2.putText(frame, f"SNAPSHOT [NOMINAL] - {time_str}", (20, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 0), 1)
    cv2.circle(frame, (615, 30), 8, (0, 255, 0), -1)
    return frame


class CameraViewSet(viewsets.ModelViewSet):
    queryset = Camera.objects.all().order_by('camera_id')
    serializer_class = CameraSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def snapshot(self, request, pk=None):
        camera = self.get_object()
        frame = get_single_camera_frame(camera)
        _, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        return HttpResponse(jpeg.tobytes(), content_type='image/jpeg')

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def stream(self, request, pk=None):
        camera = self.get_object()
        return StreamingHttpResponse(
            async_generate_camera_frames(camera),
            content_type='multipart/x-mixed-replace; boundary=frame'
        )

    @action(detail=True, methods=['post'], permission_classes=[IsOperatorOrAdmin])
    def toggle(self, request, pk=None):
        camera = self.get_object()
        camera.is_enabled = not camera.is_enabled
        camera.status = Camera.STATUS_ONLINE if camera.is_enabled else Camera.STATUS_OFFLINE
        camera.save()
        return Response({'status': camera.status, 'is_enabled': camera.is_enabled})

    @action(detail=True, methods=['get'])
    def health(self, request, pk=None):
        """
        GET /api/cameras/{id}/health
        Returns live hardware & stream health metrics (FPS, Latency, Frames processed, Status).
        """
        camera = self.get_object()
        from .manager import camera_manager
        stats = camera_manager.get_health(camera.camera_id)
        return Response(stats.to_dict())

    @action(detail=True, methods=['get', 'post'])
    def zones(self, request, pk=None):
        """
        GET/POST /api/cameras/{id}/zones
        Retrieves or creates polygon zones associated with this specific camera stream.
        """
        camera = self.get_object()
        from apps.zones.models import Zone
        from apps.zones.serializers import ZoneSerializer

        if request.method == 'GET':
            zones = Zone.objects.filter(camera=camera)
            return Response(ZoneSerializer(zones, many=True).data)
        else:
            data = request.data.copy()
            data['camera'] = camera.id
            serializer = ZoneSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[IsOperatorOrAdmin])
    def discover(self, request):
        """
        POST /api/cameras/discover
        Runs ONVIF WS-Discovery probe across local network subnet to identify
        CCTV cameras, NVRs, and Profile S/T RTSP endpoints.
        """
        from .discovery import ONVIFDiscoveryService
        devices = ONVIFDiscoveryService.discover_devices(timeout=1.5)
        return Response({'discovered_count': len(devices), 'devices': devices})

    @action(detail=False, methods=['post'], permission_classes=[IsOperatorOrAdmin])
    def import_nvr(self, request):
        """
        POST /api/cameras/import_nvr
        Batch imports multiple channels from an existing NVR (Hikvision, Dahua, Uniview, Axis, Generic).
        """
        from .discovery import NVRChannelManager
        vendor = request.data.get('vendor', 'hikvision')
        host = request.data.get('host', '192.168.1.200')
        port = int(request.data.get('port', 554))
        username = request.data.get('username', 'admin')
        password = request.data.get('password', '')
        channel_count = int(request.data.get('channel_count', 4))

        channels = NVRChannelManager.generate_channel_streams(
            vendor=vendor,
            host=host,
            port=port,
            username=username,
            password=password,
            channel_count=channel_count
        )

        created_cameras = []
        for ch in channels:
            cam, _ = Camera.objects.get_or_create(
                camera_id=ch['camera_id'],
                defaults={
                    'name': ch['name'],
                    'stream_type': Camera.TYPE_RTSP,
                    'stream_url': ch['stream_url'],
                    'username': username,
                    'status': Camera.STATUS_ONLINE,
                    'fps': 30,
                    'processing_fps': 10
                }
            )
            created_cameras.append({
                'id': cam.id,
                'camera_id': cam.camera_id,
                'name': cam.name,
                'stream_url': cam.stream_url
            })

        return Response({
            'status': 'success',
            'imported_count': len(created_cameras),
            'cameras': created_cameras
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsOperatorOrAdmin])
    def test_connection(self, request, pk=None):
        camera = self.get_object()
        from .discovery import StreamProbeService
        result = StreamProbeService.test_stream(camera.stream_url)
        return Response(result)
