import pytest
import uuid
import json
from rest_framework.test import APIClient
from apps.cameras.models import Camera


def test_jwt_auth_flow():
    client = APIClient()
    resp = client.post('/api/auth/login/', {'username': 'admin', 'password': 'admin123456'}, format='json')
    assert resp.status_code == 200
    assert 'access' in resp.data
    assert 'refresh' in resp.data
    token = resp.data['access']

    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    me_resp = client.get('/api/auth/me/')
    assert me_resp.status_code == 200
    assert me_resp.data['username'] == 'admin'


def test_cameras_api_security():
    client = APIClient()
    login_resp = client.post('/api/auth/login/', {'username': 'admin', 'password': 'admin123456'}, format='json')
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_resp.data['access']}")

    cam_unique_id = f"CAM-TEST-{uuid.uuid4().hex[:6]}"
    cam_data = {
        "name": "Secure Entrance",
        "camera_id": cam_unique_id,
        "stream_type": "rtsp",
        "stream_url": "rtsp://camera.internal/live",
        "username": "admin_cam",
        "password": "UltraSecretPassword123",
        "resolution": "1920x1080",
        "fps": 30,
        "processing_fps": 10
    }
    resp = client.post('/api/cameras/', cam_data, format='json')
    assert resp.status_code == 201
    created_id = resp.data['id']

    # Read camera back - password must NEVER be exposed
    get_resp = client.get(f'/api/cameras/{created_id}/')
    assert get_resp.status_code == 200
    assert 'password' not in get_resp.data or get_resp.data.get('password') is None
    assert get_resp.data['has_credentials'] is True


def test_analytics_dashboard_endpoint():
    client = APIClient()
    login_resp = client.post('/api/auth/login/', {'username': 'operator', 'password': 'operator123456'}, format='json')
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_resp.data['access']}")

    resp = client.get('/api/analytics/dashboard/')
    assert resp.status_code == 200
    assert 'kpis' in resp.data
    assert 'hourly_data' in resp.data
    assert 'object_distribution' in resp.data


def test_reports_daily_endpoint():
    client = APIClient()
    login_resp = client.post('/api/auth/login/', {'username': 'admin', 'password': 'admin123456'}, format='json')
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_resp.data['access']}")

    resp = client.get('/api/reports/daily/?export_format=pdf')
    assert resp.status_code == 200
    assert resp.data['report_type'] == 'daily'
    assert resp.data['status'] == 'ready'
