import os
import sys
import numpy as np
import pytest

# Add backend and root to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, 'backend'))
sys.path.insert(0, BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from ai.reid.extractor import FeatureExtractor
from ai.reid.matcher import EmbeddingMatcher
from ai.reid.similarity import cosine_similarity, classify_match_confidence
from ai.reid.service import ReIDService
from ai.zones.zone_checker import ZoneChecker
from apps.cameras.reconnect import ReconnectPolicy
from apps.cameras.health import CameraHealthStats
from apps.cameras.models import Camera
from apps.zones.models import Zone, ZoneEvent
from apps.alerts.models import Alert, AlertRule
from apps.alerts.engine import AlertEngine
from apps.objects.models import PersistentObject

User = get_user_model()


class TestPhase2AI(TestCase):
    def test_reid_extractor_and_matcher(self):
        extractor = FeatureExtractor()
        # Synthetic crop
        crop_a = np.full((128, 64, 3), 180, dtype=np.uint8)
        crop_b = np.full((128, 64, 3), 185, dtype=np.uint8)
        crop_c = np.full((128, 64, 3), 30, dtype=np.uint8)

        emb_a = extractor.extract(crop_a)
        emb_b = extractor.extract(crop_b)
        emb_c = extractor.extract(crop_c)

        sim_ab = cosine_similarity(emb_a, emb_b)
        sim_ac = cosine_similarity(emb_a, emb_c)

        self.assertGreater(sim_ab, 0.90)
        self.assertGreater(sim_ab, sim_ac)

        # Confidence classification tiers
        is_m, label = classify_match_confidence(0.97)
        self.assertTrue(is_m)
        self.assertEqual(label, "Strong match")

        is_m, label = classify_match_confidence(0.92)
        self.assertTrue(is_m)
        self.assertEqual(label, "Likely match")

        is_m, label = classify_match_confidence(0.87)
        self.assertTrue(is_m)
        self.assertEqual(label, "Possible match")

        is_m, label = classify_match_confidence(0.70)
        self.assertFalse(is_m)
        self.assertEqual(label, "Unmatched")

    def test_zone_checker_ray_casting(self):
        polygon = [{'x': 100, 'y': 100}, {'x': 300, 'y': 100}, {'x': 300, 'y': 300}, {'x': 100, 'y': 300}]
        inside_point = (200, 200)
        outside_point = (50, 50)

        self.assertTrue(ZoneChecker.is_point_in_polygon(inside_point, polygon))
        self.assertFalse(ZoneChecker.is_point_in_polygon(outside_point, polygon))

    def test_camera_reconnect_policy(self):
        policy = ReconnectPolicy(max_attempts=5, initial_delay_sec=1.0, backoff_factor=2.0)
        delay_0 = policy.record_attempt()
        delay_1 = policy.record_attempt()
        delay_2 = policy.record_attempt()

        self.assertAlmostEqual(delay_0, 1.0)
        self.assertAlmostEqual(delay_1, 2.0)
        self.assertAlmostEqual(delay_2, 4.0)

        stats = CameraHealthStats(camera_id="CAM-P2-01", fps=30.0)
        self.assertEqual(stats.fps, 30.0)
        self.assertEqual(stats.status, "online")


class TestPhase2Backend(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='phase2_operator',
            email='operator@visiontrack.ai',
            password='Password123!',
            role='operator'
        )
        # Login to obtain JWT
        res = self.client.post('/api/auth/login/', {
            'username': 'phase2_operator',
            'password': 'Password123!'
        })
        self.token = res.data.get('access') or res.data.get('tokens', {}).get('access')
        self.auth_headers = {'HTTP_AUTHORIZATION': f'Bearer {self.token}'}

        self.camera = Camera.objects.create(
            name='Phase 2 Test Cam',
            camera_id='CAM-P2-99',
            stream_type='simulated',
            stream_url='synth://1',
            fps=30,
            status='online'
        )

        self.zone = Zone.objects.create(
            camera=self.camera,
            name='Restricted Vault',
            zone_type='restricted',
            polygon_points=[{'x': 10, 'y': 10}, {'x': 200, 'y': 10}, {'x': 200, 'y': 200}, {'x': 10, 'y': 200}],
            rules=['person_entry'],
            max_dwell_seconds=20,
            max_occupancy=2
        )

        now = django.utils.timezone.now()
        self.obj = PersistentObject.objects.create(
            internal_id='OBJ-P2-001',
            object_type='person',
            first_seen=now,
            last_seen=now
        )

    def test_alert_engine_and_lifecycle(self):
        # 1. Trigger Zone Event
        zone_event = ZoneEvent.objects.create(
            zone=self.zone,
            camera=self.camera,
            persistent_object=self.obj,
            track_id=88,
            object_type='person',
            event_type='enter'
        )

        # 2. Evaluate Zone Event with AlertEngine
        alert = AlertEngine.evaluate_zone_event(zone_event)
        self.assertIsNotNone(alert)
        self.assertEqual(alert.priority, Alert.PRIORITY_HIGH)
        self.assertEqual(alert.status, Alert.STATUS_NEW)

        # 3. Acknowledge alert via API
        ack_res = self.client.post(f'/api/alerts/{alert.id}/acknowledge/', **self.auth_headers)
        self.assertEqual(ack_res.status_code, 200)
        alert.refresh_from_db()
        self.assertEqual(alert.status, Alert.STATUS_ACKNOWLEDGED)

        # 4. Resolve alert via API
        res_res = self.client.post(f'/api/alerts/{alert.id}/resolve/', **self.auth_headers)
        self.assertEqual(res_res.status_code, 200)
        alert.refresh_from_db()
        self.assertEqual(alert.status, Alert.STATUS_RESOLVED)

    def test_heatmap_api(self):
        res = self.client.get('/api/analytics/heatmap/?camera_id=CAM-P2-99&class_name=person', **self.auth_headers)
        self.assertEqual(res.status_code, 200)
        self.assertIn('points', res.data)
        self.assertGreater(len(res.data['points']), 0)

    def test_system_health_and_metrics_api(self):
        health_res = self.client.get('/api/system/health/')
        self.assertEqual(health_res.status_code, 200)
        self.assertEqual(health_res.data['status'], 'healthy')
        self.assertIn('cpu', health_res.data)
        self.assertIn('memory', health_res.data)
        self.assertIn('database', health_res.data)

        metrics_res = self.client.get('/api/system/metrics/')
        self.assertEqual(metrics_res.status_code, 200)
        self.assertIn('metrics', metrics_res.data)
