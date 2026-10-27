from django.db import models
from .crypto import encrypt_credential, decrypt_credential


class Camera(models.Model):
    TYPE_WEBCAM = 'webcam'
    TYPE_RTSP = 'rtsp'
    TYPE_IP = 'ip'
    TYPE_SIMULATED = 'simulated'

    STREAM_TYPES = [
        (TYPE_WEBCAM, 'USB Webcam'),
        (TYPE_RTSP, 'RTSP Stream'),
        (TYPE_IP, 'IP / Network Camera'),
        (TYPE_SIMULATED, 'Simulated Demo Camera'),
    ]

    STATUS_ONLINE = 'online'
    STATUS_OFFLINE = 'offline'
    STATUS_ERROR = 'error'

    STATUS_CHOICES = [
        (STATUS_ONLINE, 'Online'),
        (STATUS_OFFLINE, 'Offline'),
        (STATUS_ERROR, 'Error'),
    ]

    name = models.CharField(max_length=100)
    camera_id = models.CharField(max_length=50, unique=True, help_text="e.g. CAM-01")
    stream_type = models.CharField(max_length=20, choices=STREAM_TYPES, default=TYPE_SIMULATED)
    stream_url = models.CharField(max_length=500, blank=True, default="simulated://demo-feed")
    username = models.CharField(max_length=100, blank=True, null=True)
    encrypted_password = models.CharField(max_length=500, blank=True, null=True)

    resolution = models.CharField(max_length=20, default="1920x1080")
    fps = models.PositiveIntegerField(default=30)
    processing_fps = models.PositiveIntegerField(default=10)

    detection_model = models.CharField(max_length=50, default="yolov8n")
    confidence_threshold = models.FloatField(default=0.50)
    tracking_algorithm = models.CharField(max_length=50, default="bytetrack", choices=[("bytetrack", "ByteTrack"), ("botsort", "BoT-SORT")])

    is_enabled = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ONLINE)
    last_ping = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cameras'
        ordering = ['camera_id']

    def __str__(self):
        return f"{self.camera_id} - {self.name}"

    def set_password(self, plain_password: str):
        self.encrypted_password = encrypt_credential(plain_password)

    def get_password(self) -> str:
        return decrypt_credential(self.encrypted_password)
