from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_ADMIN = 'admin'
    ROLE_OPERATOR = 'operator'
    ROLE_VIEWER = 'viewer'

    ROLE_CHOICES = [
        (ROLE_ADMIN, 'Administrator'),
        (ROLE_OPERATOR, 'Operator'),
        (ROLE_VIEWER, 'Viewer'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_VIEWER)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)

    class Meta:
        db_table = 'auth_users'
        ordering = ['-date_joined']

    def is_admin_user(self):
        return self.role == self.ROLE_ADMIN or self.is_superuser

    def is_operator_user(self):
        return self.role in [self.ROLE_ADMIN, self.ROLE_OPERATOR] or self.is_superuser
