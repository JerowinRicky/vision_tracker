from django.urls import re_path
from .consumers import (
    LiveEventsConsumer,
    DashboardConsumer,
    CameraStreamConsumer,
    AlertsConsumer,
    JobsConsumer,
)

websocket_urlpatterns = [
    re_path(r'ws/events/$', LiveEventsConsumer.as_asgi()),
    re_path(r'ws/dashboard/$', DashboardConsumer.as_asgi()),
    re_path(r'ws/cameras/(?P<camera_id>[\w\-]+)/$', CameraStreamConsumer.as_asgi()),
    re_path(r'ws/alerts/$', AlertsConsumer.as_asgi()),
    re_path(r'ws/jobs/(?P<job_id>[\w\-]+)/$', JobsConsumer.as_asgi()),
    re_path(r'ws/processing/(?P<job_id>[\w\-]+)/$', JobsConsumer.as_asgi()),
]
