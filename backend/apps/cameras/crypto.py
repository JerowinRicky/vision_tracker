import base64
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from django.conf import settings


def _get_fernet():
    key_material = getattr(settings, 'SECRET_KEY', 'default-camera-key-secret-2026').encode()
    salt = b'visiontrack_salt'
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(key_material))
    return Fernet(key)


def encrypt_credential(plain_text: str) -> str:
    if not plain_text:
        return ""
    fernet = _get_fernet()
    return fernet.encrypt(plain_text.encode()).decode()


def decrypt_credential(cipher_text: str) -> str:
    if not cipher_text:
        return ""
    try:
        fernet = _get_fernet()
        return fernet.decrypt(cipher_text.encode()).decode()
    except Exception:
        return ""
