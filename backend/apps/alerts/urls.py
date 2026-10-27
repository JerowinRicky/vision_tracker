from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AlertViewSet, AlertRuleViewSet

router = DefaultRouter()
router.register(r'rules', AlertRuleViewSet, basename='alert-rule')
router.register(r'', AlertViewSet, basename='alert')

urlpatterns = [
    path('', include(router.urls)),
]
