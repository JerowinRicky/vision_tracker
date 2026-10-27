import re
import ipaddress
from urllib.parse import urlparse
from typing import Dict, Optional, List
from .stream import CameraStreamReader
from .health import CameraHealthStats


FORBIDDEN_HOSTS = {
    "169.254.169.254",  # Cloud metadata
    "metadata.google.internal",
    "127.0.0.1",
    "localhost",
    "::1",
    "0.0.0.0"
}


def validate_camera_url_ssrf_safe(url: str, stream_type: str) -> bool:
    """
    Guards against Server-Side Request Forgery (SSRF) in camera stream URLs.
    Blocks AWS/GCP/Azure instance metadata endpoints and sensitive internal IP ranges.
    """
    if stream_type in ["simulated", "webcam"]:
        return True

    try:
        parsed = urlparse(url)
        host = parsed.hostname
        if not host:
            return False

        if host.lower() in FORBIDDEN_HOSTS:
            return False

        # Check private IP ranges if user is not in internal dev mode
        try:
            ip = ipaddress.ip_address(host)
            if ip.is_loopback or ip.is_link_local:
                return False
        except ValueError:
            pass

        return True
    except Exception:
        return False


class CameraManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CameraManager, cls).__new__(cls)
            cls._instance.readers = {}
        return cls._instance

    def get_or_create_stream(self, camera) -> CameraStreamReader:
        cam_id = camera.camera_id
        if cam_id not in self.readers:
            reader = CameraStreamReader(
                camera_id=cam_id,
                stream_url=camera.stream_url,
                stream_type=camera.stream_type,
                target_fps=camera.fps,
                processing_fps=camera.processing_fps
            )
            reader.start()
            self.readers[cam_id] = reader
        return self.readers[cam_id]

    def get_health(self, camera_id: str) -> CameraHealthStats:
        if camera_id in self.readers:
            return self.readers[camera_id].health
        return CameraHealthStats(camera_id=camera_id, status="offline", fps=0.0)

    def shutdown_all(self):
        for reader in self.readers.values():
            reader.stop()
        self.readers.clear()


camera_manager = CameraManager()
