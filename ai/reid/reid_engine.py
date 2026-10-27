"""
Appearance-based Object Re-Identification (ReID) Engine.
Wraps the modular ReIDService architecture for backward compatibility.
"""

from .service import ReIDService

class ReIDEngine(ReIDService):
    def match_against_gallery(self, query_embedding, gallery, class_name=None):
        return self.match_best(query_embedding, gallery, class_name=class_name)
