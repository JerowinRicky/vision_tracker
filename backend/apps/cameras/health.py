import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, Any, Optional


@dataclass
class CameraHealthStats:
    camera_id: str
    status: str = "online"
    fps: float = 29.5
    processing_fps: float = 10.0
    latency_ms: float = 38.0
    frames_processed: int = 0
    frames_dropped: int = 0
    cpu_percent: float = 18.5
    gpu_percent: float = 24.0
    memory_mb: float = 142.0
    last_frame_timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    error_message: Optional[str] = None
    reconnect_attempts: int = 0
    reconnect_max: int = 5

    def to_dict(self) -> Dict[str, Any]:
        return {
            "camera_id": self.camera_id,
            "status": self.status,
            "fps": round(self.fps, 1),
            "processing_fps": round(self.processing_fps, 1),
            "latency_ms": round(self.latency_ms, 1),
            "frames_processed": self.frames_processed,
            "frames_dropped": self.frames_dropped,
            "cpu_percent": self.cpu_percent,
            "gpu_percent": self.gpu_percent,
            "memory_mb": self.memory_mb,
            "last_frame_timestamp": self.last_frame_timestamp,
            "error_message": self.error_message,
            "reconnect_status": f"{self.reconnect_attempts} / {self.reconnect_max}" if self.status == "offline" else "nominal"
        }
