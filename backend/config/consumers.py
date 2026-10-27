import json
from channels.generic.websocket import AsyncWebsocketConsumer


class BaseBroadcastingConsumer(AsyncWebsocketConsumer):
    group_name = "visiontrack_events"

    async def connect(self):
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send(text_data=json.dumps({
            "event": "connection.established",
            "channel": self.group_name
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            if data.get("action") == "ping":
                await self.send(text_data=json.dumps({"event": "pong"}))
        except Exception:
            pass

    async def event_message(self, event):
        await self.send(text_data=json.dumps({
            "event": event.get("event"),
            "data": event.get("data", {})
        }))


class LiveEventsConsumer(BaseBroadcastingConsumer):
    group_name = "visiontrack_events"


class DashboardConsumer(BaseBroadcastingConsumer):
    group_name = "dashboard_events"


class CameraStreamConsumer(BaseBroadcastingConsumer):
    async def connect(self):
        camera_id = self.scope['url_route']['kwargs'].get('camera_id', 'all')
        self.group_name = f"camera_{camera_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send(text_data=json.dumps({
            "event": "connection.established",
            "camera_id": camera_id
        }))


class AlertsConsumer(BaseBroadcastingConsumer):
    group_name = "alerts_events"


class JobsConsumer(BaseBroadcastingConsumer):
    async def connect(self):
        job_id = self.scope['url_route']['kwargs'].get('job_id', 'all')
        self.group_name = f"job_{job_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send(text_data=json.dumps({
            "event": "connection.established",
            "job_id": job_id
        }))
