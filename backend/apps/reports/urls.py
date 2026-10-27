from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportViewSet

router = DefaultRouter()
router.register(r'', ReportViewSet, basename='report')

urlpatterns = [
    path('daily/', ReportViewSet.as_view({'get': 'daily'}), name='report_daily'),
    path('weekly/', ReportViewSet.as_view({'get': 'weekly'}), name='report_weekly'),
    path('monthly/', ReportViewSet.as_view({'get': 'monthly'}), name='report_monthly'),
    path('', include(router.urls)),
]
