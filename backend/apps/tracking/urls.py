from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TrackRecordViewSet

router = DefaultRouter()
router.register(r'', TrackRecordViewSet, basename='tracking')

urlpatterns = [
    path('', include(router.urls)),
]
