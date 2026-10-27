from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PersistentObjectViewSet, EvidenceImageViewSet

router = DefaultRouter()
router.register(r'evidence', EvidenceImageViewSet, basename='evidence')
router.register(r'', PersistentObjectViewSet, basename='object')

urlpatterns = [
    path('', include(router.urls)),
]
