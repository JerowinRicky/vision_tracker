from django.db import models
from apps.objects.models import PersistentObject


class ReIDEmbedding(models.Model):
    persistent_object = models.ForeignKey(PersistentObject, on_delete=models.CASCADE, related_name='embeddings')
    track_id = models.IntegerField(null=True, blank=True)
    embedding_vector = models.JSONField(help_text="128-dimensional L2 normalized feature array")
    quality_score = models.FloatField(default=0.85)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reid_embeddings'
        ordering = ['-created_at']

    def __str__(self):
        return f"Embedding for {self.persistent_object.internal_id} ({self.created_at})"
