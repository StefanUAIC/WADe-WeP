import os
import uvicorn
from dotenv import load_dotenv
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from services.fuseki_service import FusekiService
from services.dbpedia_service import DBpediaService
from services.qr_service import QRCodeService
from services.shacl_service import SHACLService
from models.article import Article, ArticleCreate

load_dotenv()

app = FastAPI(title="WeP - Web News Provenance", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

fuseki_url = os.getenv("FUSEKI_URL", "http://fuseki:3030")
fuseki_service = FusekiService(fuseki_url)
dbpedia_service = DBpediaService()

@app.get("/")
def root():
    return {"message": "WeP - Web News Provenance API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    fuseki_status = fuseki_service.check_connection()
    return {
        "status": "healthy" if fuseki_status else "degraded",
        "fuseki_url": fuseki_url,
        "fuseki_connected": fuseki_status
    }

@app.get("/api/articles")
def get_articles():
    try:
        articles = fuseki_service.get_articles()
        return {"articles": articles, "count": len(articles)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/articles")
def create_article(article: ArticleCreate):
    try:
        article_dict = article.dict()
        print(f"Creating article: {article_dict['title']}")
        enriched_data = dbpedia_service.enrich_article(article_dict)
        print(f"Enriched with {len(enriched_data.get('dbpedia_entities', []))} entities")
        result = fuseki_service.create_article(enriched_data)
        if result:
            print(f"Article created: {result['id']}")
            return result
        print("Failed to create article - no result")
        raise HTTPException(status_code=500, detail="Failed to create article")
    except Exception as e:
        print(f"Error creating article: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/articles/{article_id}")
def get_article(article_id: str):
    try:
        article = fuseki_service.get_article_with_provenance(article_id)
        if article:
            return article
        raise HTTPException(status_code=404, detail="Article not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/articles/{article_id}/recommendations")
def get_recommendations(article_id: str):
    try:
        recommendations = fuseki_service.get_recommendations(article_id)
        return {"recommendations": recommendations, "count": len(recommendations)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/articles/{article_id}/jsonld")
def get_article_jsonld(article_id: str):
    try:
        article = fuseki_service.get_article_with_provenance(article_id)
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
        
        base_url = os.getenv("BASE_URL", "http://localhost:8000")
        
        jsonld = {
            "@context": "http://schema.org/",
            "@type": "NewsArticle",
            "@id": f"{base_url}/article/{article_id}",
            "headline": article["title"],
            "articleBody": article["content"],
            "author": {
                "@type": "Person",
                "name": article["author"]
            },
            "publisher": {
                "@type": "Organization",
                "name": article["publication"]
            },
            "inLanguage": article["language"],
            "dateCreated": article["created_at"],
            "keywords": article.get("keywords", [])
        }
        return jsonld
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/articles/{article_id}/rdf")
def get_article_rdf(article_id: str, format: str = "turtle"):
    try:
        rdf_data = fuseki_service.get_article_rdf(article_id, format)
        if rdf_data:
            return {"format": format, "data": rdf_data}
        raise HTTPException(status_code=404, detail="Article not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sparql/query")
def sparql_query_post(query: dict):
    try:
        result = fuseki_service.execute_sparql(query.get("query", ""))
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/dbpedia/entity")
def get_dbpedia_entity(uri: str):
    try:
        info = dbpedia_service.get_entity_info(uri)
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/statistics")
def get_statistics():
    try:
        stats = fuseki_service.get_statistics()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/search")
def search_articles(q: str, language: str = None):
    try:
        results = fuseki_service.search_articles(q, language)
        return {"results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/wikidata/search")
def search_wikidata(q: str):
    try:
        results = dbpedia_service.search_wikidata(q)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/provenance/{article_id}")
def get_provenance_chain(article_id: str):
    try:
        chain = fuseki_service.get_full_provenance_chain(article_id)
        return chain
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/articles/{article_id}/qrcode")
def get_article_qrcode(article_id: str):
    try:
        qr_info = QRCodeService.generate_qr_info(article_id)
        return qr_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/validate")
def validate_rdf_data(data: dict):
    try:
        rdf_data = data.get("rdf", "")
        validation_result = SHACLService.validate_article_data(rdf_data)
        return validation_result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/shacl/shapes")
def get_shacl_shapes():
    try:
        shapes = SHACLService.get_shapes_graph()
        return {"shapes": shapes.serialize(format="turtle")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
