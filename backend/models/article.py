from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class ArticleCreate(BaseModel):
    keywords: Optional[List[str]] = []
    url: Optional[str] = None
    language: str = "en"
    publication: str
    content: str
    author: str
    title: str

class Article(BaseModel):
    provenance_chain: Optional[List[dict]] = []
    dbpedia_entities: Optional[List[str]] = []
    url: Optional[str] = None
    created_at: datetime
    keywords: List[str]
    publication: str
    language: str
    content: str
    author: str
    title: str
    id: str
