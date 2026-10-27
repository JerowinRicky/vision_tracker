from django.urls import path
from .views import ReIDViewSet

urlpatterns = [
    path('matches/', ReIDViewSet.as_view({'get': 'matches'}), name='reid_matches'),
]
