from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class ArticleCreate(BaseModel):
    based_on_article_id: Optional[str] = None
    keywords: Optional[List[str]] = []
    iptc_subjects: Optional[List[str]] = []
    url: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    audio_url: Optional[str] = None
    derivation_type: Optional[str] = None
    language: str = "en"
    publication: str
    content: str
    author: str
    title: str

class Article(BaseModel):
    provenance_chain: Optional[List[dict]] = []
    dbpedia_entities: Optional[List[str]] = []
    iptc_subjects: Optional[List[str]] = []
    based_on_article_id: Optional[str] = None
    url: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    audio_url: Optional[str] = None
    derivation_type: Optional[str] = None
    created_at: datetime
    keywords: List[str]
    publication: str
    language: str
    content: str
    author: str
    title: str
    id: str
