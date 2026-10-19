import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

KNOWLEDGE_FILE_PATH = Path(__file__).resolve().parent / "college_data.json"

class KnowledgeBase:
    _instance: Optional["KnowledgeBase"] = None

    def __init__(self, data_path: Optional[Path] = None):
        self.data_path = data_path or KNOWLEDGE_FILE_PATH
        self.data: Dict[str, Any] = {}
        self.sections: List[Dict[str, Any]] = []
        self.faqs: List[Dict[str, Any]] = []
        self.meta: Dict[str, Any] = {}
        self.load()

    def load(self) -> None:
        try:
            with open(self.data_path, "r", encoding="utf-8") as f:
                self.data = json.load(f)
            self.sections = self.data.get("sections", [])
            self.faqs = self.data.get("frequently_asked_questions", [])
            self.meta = self.data.get("college_meta", {})
            logger.info("Loaded college knowledge base with %d sections and %d FAQs.", len(self.sections), len(self.faqs))
        except Exception as e:
            logger.error("Failed to load knowledge base from %s: %s", self.data_path, e)
            self.data = {}
            self.sections = []
            self.faqs = []
            self.meta = {"name": "Demo College", "status": "Fallback mode"}

    def get_section_by_id(self, section_id: str) -> Optional[Dict[str, Any]]:
        for sec in self.sections:
            if sec.get("id") == section_id:
                return sec
        return None

    def get_all_categories(self) -> List[str]:
        return list(set(sec.get("category", "general") for sec in self.sections))


# Global singleton instance
def get_knowledge_base() -> KnowledgeBase:
    if KnowledgeBase._instance is None:
        KnowledgeBase._instance = KnowledgeBase()
    return KnowledgeBase._instance
