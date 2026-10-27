from django.db import models
from apps.authentication.models import User


class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    username = models.CharField(max_length=150, blank=True)
    action = models.CharField(max_length=100, db_index=True)
    resource_type = models.CharField(max_length=50, db_index=True)  # camera, video, settings, user, zone
    resource_id = models.CharField(max_length=100, blank=True, null=True)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.timestamp}] {self.username or 'System'} - {self.action} on {self.resource_type}"

    @classmethod
    def log_event(cls, action: str, resource_type: str, resource_id: str = "", details: dict = None, request=None, user=None):
        req_user = user or (request.user if request and request.user.is_authenticated else None)
        username = req_user.username if req_user else "System"
        ip = None
        if request:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0].strip()
            else:
                ip = request.META.get('REMOTE_ADDR')

        return cls.objects.create(
            user=req_user,
            username=username,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id),
            details=details or {},
            ip_address=ip
        )
