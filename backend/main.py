import os
import uvicorn
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.fuseki_service import FusekiService
from services.dbpedia_service import DBpediaService
from models.article import Article, ArticleCreate

app = FastAPI(title="WeP - Web News Provenance", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

fuseki_url = os.getenv("FUSEKI_URL", "http://localhost:3030")
fuseki_service = FusekiService(fuseki_url)
dbpedia_service = DBpediaService()

@app.get("/")
async def root():
    return {"message": "WeP - Web News Provenance API"}

@app.get("/health")
async def health_check():
    try:
        status = await fuseki_service.check_connection()
        return {"status": "healthy", "fuseki": status}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")

@app.get("/api/articles", response_model=List[Article])
async def get_articles():
    try:
        return await fuseki_service.get_articles()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/articles", response_model=Article)
async def create_article(article: ArticleCreate):
    try:
        enriched_data = await dbpedia_service.enrich_article(article.dict())
        result = await fuseki_service.create_article(enriched_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/articles/{article_id}")
async def get_article(article_id: str):
    try:
        return await fuseki_service.get_article_with_provenance(article_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail="Article not found")

@app.get("/api/articles/{article_id}/recommendations")
async def get_recommendations(article_id: str):
    try:
        return await fuseki_service.get_recommendations(article_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sparql")
async def sparql_query(query: str):
    try:
        return await fuseki_service.execute_sparql(query)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
