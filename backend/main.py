import os
import uvicorn
from dotenv import load_dotenv
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from SPARQLWrapper import SPARQLWrapper, JSON

from services.fuseki_service import FusekiService
from services.dbpedia_service import DBpediaService
from services.qr_service import QRCodeService
from services.shacl_service import SHACLService
from services.recommendation_service import RecommendationService
from models.article import Article, ArticleCreate

load_dotenv()

app = FastAPI(title="WeP - Web News Provenance", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://16.170.172.125:3000"],
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
        enriched_data = dbpedia_service.enrich_article(article_dict)
        result = fuseki_service.create_article(enriched_data)
        if result:
            return result
        raise HTTPException(status_code=500, detail="Failed to create article")
    except Exception as e:
        print(f"Error creating article: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/articles/{article_id}/validate")
def validate_article(article_id: str):
    try:
        rdf_data = fuseki_service.get_article_rdf(article_id, "turtle")
        if not rdf_data:
            raise HTTPException(status_code=404, detail="Article not found")
        
        validation_result = SHACLService.validate_article_data(rdf_data)
        return validation_result
    except Exception as e:
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
        current_article = fuseki_service.get_article_with_provenance(article_id)
        if not current_article:
            raise HTTPException(status_code=404, detail="Article not found")
        
        all_articles = fuseki_service.get_articles()
        
        ml_recommendations = RecommendationService.get_ml_recommendations(
            current_article, 
            all_articles, 
            limit=5
        )
        
        return {"recommendations": ml_recommendations, "count": len(ml_recommendations), "method": "ML (TF-IDF + Cosine Similarity)"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/articles/{article_id}/jsonld")
def get_article_jsonld(article_id: str):
    try:
        article = fuseki_service.get_article_with_provenance(article_id)
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
        
        provenance = fuseki_service.get_full_provenance_chain(article_id)
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        
        jsonld = {
            "@context": "http://schema.org/",
            "@type": "NewsArticle",
            "@id": f"{frontend_url}/articles/{article_id}",
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
        
        if article.get("image_urls"):
            jsonld["image"] = article["image_urls"]
        
        if article.get("video_urls"):
            jsonld["video"] = article["video_urls"]
        
        if article.get("audio_urls"):
            jsonld["audio"] = article["audio_urls"]
        
        if provenance.get("derived_from"):
            jsonld["isBasedOn"] = provenance["derived_from"]
        
        if provenance.get("related_entities"):
            jsonld["mentions"] = [
                {"@type": "Thing", "@id": uri} 
                for uri in provenance["related_entities"][:5]
            ]
        
        if provenance.get("wikidata_entities"):
            jsonld["sameAs"] = provenance["wikidata_entities"]
        
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

@app.get("/api/wikidata/label")
def get_wikidata_label(uri: str):
    try:
        entity_id = uri.split('/')[-1]
        query = f"""
        SELECT ?label WHERE {{
            wd:{entity_id} rdfs:label ?label .
            FILTER(LANG(?label) = "en")
        }}
        LIMIT 1
        """
        
        sparql = SPARQLWrapper("https://query.wikidata.org/sparql")
        sparql.setQuery(query)
        sparql.setReturnFormat(JSON)
        result = sparql.query().convert()
        
        bindings = result.get("results", {}).get("bindings", [])
        if bindings:
            return {"label": bindings[0]["label"]["value"]}
        return {"label": entity_id}
    except:
        return {"label": uri.split('/')[-1]}

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
