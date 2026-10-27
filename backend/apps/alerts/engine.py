"""
Alert Rule Evaluation Engine for VisionTrack AI
Evaluates real-time events against configured AlertRules and triggers alerts,
updating cooldowns and broadcasting via WebSockets.
"""
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from apps.alerts.models import Alert, AlertRule
from apps.cameras.models import Camera
from apps.zones.models import Zone
from apps.objects.models import PersistentObject

logger = logging.getLogger('visiontrack.alerts')


class AlertEngine:
    """
    Central evaluation engine for rule-based alerts.
    """

    @classmethod
    def evaluate_zone_event(cls, zone_event) -> Optional[Alert]:
        """
        Evaluate a ZoneEvent (enter, dwell_exceeded, occupancy_exceeded) against active rules.
        """
        zone = zone_event.zone
        camera = zone_event.camera
        event_type = zone_event.event_type
        object_type = (zone_event.object_type or '').lower()

        now = datetime.now(timezone.utc)
        triggered_alert = None

        # 1. Restricted zone breaches
        if zone.zone_type == 'restricted' and event_type == 'enter':
            rule_type = AlertRule.RULE_PERSON_RESTRICTED if object_type == 'person' else AlertRule.RULE_VEHICLE_RESTRICTED
            rule = cls._get_matching_rule(rule_type=rule_type, zone=zone, camera=camera)
            priority = rule.priority if rule else Alert.PRIORITY_HIGH

            if not rule or cls._can_trigger(rule, now):
                triggered_alert = Alert.objects.create(
                    camera=camera,
                    zone=zone,
                    persistent_object=zone_event.persistent_object,
                    alert_type='RESTRICTED_ZONE_BREACH',
                    priority=priority,
                    severity='critical' if priority == Alert.PRIORITY_CRITICAL else 'warning',
                    status=Alert.STATUS_NEW,
                    title=f"Restricted Zone Breach: {zone.name}",
                    message=f"{object_type.title()} #{zone_event.track_id} entered restricted zone '{zone.name}'.",
                    track_id=zone_event.track_id,
                    object_type=object_type,
                    evidence_image=getattr(zone_event, 'evidence_image', None)
                )
                if rule:
                    rule.last_triggered_at = now
                    rule.save(update_fields=['last_triggered_at'])

        # 2. Dwell / Loitering
        elif event_type == 'dwell_exceeded':
            rule = cls._get_matching_rule(rule_type=AlertRule.RULE_OBJECT_LOITERING, zone=zone, camera=camera)
            priority = rule.priority if rule else Alert.PRIORITY_MEDIUM

            if not rule or cls._can_trigger(rule, now):
                triggered_alert = Alert.objects.create(
                    camera=camera,
                    zone=zone,
                    persistent_object=zone_event.persistent_object,
                    alert_type='OBJECT_LOITERING',
                    priority=priority,
                    severity='warning',
                    status=Alert.STATUS_NEW,
                    title=f"Loitering Alert: {zone.name}",
                    message=f"{object_type.title()} #{zone_event.track_id} exceeded dwell time threshold in zone '{zone.name}'.",
                    track_id=zone_event.track_id,
                    object_type=object_type,
                    evidence_image=getattr(zone_event, 'evidence_image', None)
                )
                if rule:
                    rule.last_triggered_at = now
                    rule.save(update_fields=['last_triggered_at'])

        # 3. Occupancy Exceeded
        elif event_type == 'occupancy_exceeded':
            rule = cls._get_matching_rule(rule_type=AlertRule.RULE_HIGH_OBJECT_COUNT, zone=zone, camera=camera)
            priority = rule.priority if rule else Alert.PRIORITY_MEDIUM

            if not rule or cls._can_trigger(rule, now):
                triggered_alert = Alert.objects.create(
                    camera=camera,
                    zone=zone,
                    alert_type='MAX_OCCUPANCY_EXCEEDED',
                    priority=priority,
                    severity='warning',
                    status=Alert.STATUS_NEW,
                    title=f"High Occupancy Alert: {zone.name}",
                    message=f"Zone '{zone.name}' exceeded maximum allowed occupancy.",
                    object_type=object_type
                )
                if rule:
                    rule.last_triggered_at = now
                    rule.save(update_fields=['last_triggered_at'])

        if triggered_alert:
            cls._broadcast_alert(triggered_alert)

        return triggered_alert

    @classmethod
    def evaluate_camera_offline(cls, camera: Camera, reason: str = "") -> Optional[Alert]:
        """
        Trigger an alert when a camera stream disconnects.
        """
        now = datetime.now(timezone.utc)
        rule = cls._get_matching_rule(rule_type=AlertRule.RULE_CAMERA_OFFLINE, camera=camera)
        priority = rule.priority if rule else Alert.PRIORITY_MEDIUM

        if not rule or cls._can_trigger(rule, now):
            alert = Alert.objects.create(
                camera=camera,
                alert_type='CAMERA_OFFLINE',
                priority=priority,
                severity='warning',
                status=Alert.STATUS_NEW,
                title=f"Camera Offline: {camera.name}",
                message=f"Camera '{camera.name}' ({camera.camera_id}) lost connection. {reason}".strip(),
            )
            if rule:
                rule.last_triggered_at = now
                rule.save(update_fields=['last_triggered_at'])

            cls._broadcast_alert(alert)
            return alert
        return None

    @classmethod
    def evaluate_reid_match(cls, persistent_object: PersistentObject, camera: Camera,
                            similarity: float, track_id: int) -> Optional[Alert]:
        """
        Trigger an alert on ReID cross-camera match.
        """
        now = datetime.now(timezone.utc)
        rule = cls._get_matching_rule(rule_type=AlertRule.RULE_REID_MATCH, camera=camera)
        priority = rule.priority if rule else Alert.PRIORITY_LOW

        if not rule or cls._can_trigger(rule, now):
            alert = Alert.objects.create(
                camera=camera,
                persistent_object=persistent_object,
                alert_type='REIDENTIFICATION_MATCH',
                priority=priority,
                severity='info',
                status=Alert.STATUS_NEW,
                title=f"Re-Identification: {persistent_object.internal_id}",
                message=f"Object {persistent_object.internal_id} re-identified on camera '{camera.name}' with similarity {similarity * 100:.1f}%.",
                track_id=track_id,
                object_type=persistent_object.object_class
            )
            if rule:
                rule.last_triggered_at = now
                rule.save(update_fields=['last_triggered_at'])

            cls._broadcast_alert(alert)
            return alert
        return None

    @classmethod
    def _get_matching_rule(cls, rule_type: str, zone: Optional[Zone] = None,
                           camera: Optional[Camera] = None) -> Optional[AlertRule]:
        qs = AlertRule.objects.filter(rule_type=rule_type, is_active=True)
        if zone:
            zone_rule = qs.filter(zone=zone).first()
            if zone_rule:
                return zone_rule
        if camera:
            cam_rule = qs.filter(camera=camera).first()
            if cam_rule:
                return cam_rule
        return qs.filter(zone__isnull=True, camera__isnull=True).first()

    @classmethod
    def _can_trigger(cls, rule: AlertRule, now: datetime) -> bool:
        if not rule.last_triggered_at:
            return True
        diff = (now - rule.last_triggered_at).total_seconds()
        return diff >= rule.cooldown_seconds

    @classmethod
    def _broadcast_alert(cls, alert: Alert):
        try:
            from workers.tasks.video_tasks import broadcast_ws_event
            payload = {
                'id': alert.id,
                'title': alert.title,
                'message': alert.message,
                'priority': alert.priority,
                'severity': alert.severity,
                'status': alert.status,
                'alert_type': alert.alert_type,
                'camera_id': alert.camera.camera_id if alert.camera else None,
                'zone_name': alert.zone.name if alert.zone else None,
                'created_at': alert.created_at.isoformat() if alert.created_at else None,
            }
            broadcast_ws_event('alerts', 'alert_created', payload)
        except Exception as e:
            logger.debug("Failed to broadcast alert WS event: %s", e)
