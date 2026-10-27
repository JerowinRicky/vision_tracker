from django.urls import path
from .system_views import SystemHealthView, SystemMetricsView

urlpatterns = [
    path('health/', SystemHealthView.as_view(), name='system_health'),
    path('metrics/', SystemMetricsView.as_view(), name='system_metrics'),
]
