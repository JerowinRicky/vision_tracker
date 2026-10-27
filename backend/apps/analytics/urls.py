from django.urls import path
from .views import (
    DashboardStatisticsView,
    AnalyticsOverviewView,
    CameraAnalyticsView,
    ZoneAnalyticsView,
    VisitorTrendsView,
    MovementHeatmapView,
)

urlpatterns = [
    path('dashboard/', DashboardStatisticsView.as_view(), name='dashboard_statistics'),
    path('overview/', AnalyticsOverviewView.as_view(), name='analytics_overview'),
    path('cameras/', CameraAnalyticsView.as_view(), name='camera_analytics'),
    path('zones/', ZoneAnalyticsView.as_view(), name='zone_analytics'),
    path('visitors/', VisitorTrendsView.as_view(), name='visitor_trends'),
    path('heatmap/', MovementHeatmapView.as_view(), name='movement_heatmap'),
]
