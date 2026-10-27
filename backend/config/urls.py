from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # VisionTrack API Endpoints
    path('api/auth/', include('apps.authentication.urls')),
    path('api/cameras/', include('apps.cameras.urls')),
    path('api/videos/', include('apps.videos.urls')),
    path('api/objects/', include('apps.objects.urls')),
    path('api/visits/', include('apps.visits.urls')),
    path('api/zones/', include('apps.zones.urls')),
    path('api/alerts/', include('apps.alerts.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/settings/', include('apps.settings.urls')),
    path('api/audit/', include('apps.audit.urls')),
    path('api/detection/', include('apps.detection.urls')),
    path('api/tracking/', include('apps.tracking.urls')),
    path('api/reid/', include('apps.reidentification.urls')),
    path('api/system/', include('apps.analytics.system_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
