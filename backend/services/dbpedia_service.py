import requests
from typing import Dict, List
from SPARQLWrapper import SPARQLWrapper, JSON

class DBpediaService:
    def __init__(self):
        self.dbpedia_endpoint = "http://dbpedia.org/sparql"
        self.wikidata_endpoint = "https://query.wikidata.org/sparql"
        self.spotlight_endpoint = "https://api.dbpedia-spotlight.org/en/annotate"
        
    def enrich_article(self, article_data: Dict) -> Dict:
        text = article_data.get("content", "") + " " + article_data.get("title", "")
        entities = self.extract_entities(text)
        article_data["dbpedia_entities"] = entities
        
        if entities:
            wikidata_entities = self.get_wikidata_links(entities[:3])
            article_data["wikidata_entities"] = wikidata_entities
        else:
            article_data["wikidata_entities"] = []
        
        return article_data
    
    def extract_entities(self, text: str) -> List[str]:
        if not text or len(text) < 20:
            return []
        
        try:
            response = requests.post(
                self.spotlight_endpoint,
                data={"text": text[:1000], "confidence": 0.3, "support": 10},
                headers={"Accept": "application/json"},
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                resources = data.get("Resources", [])
                entities = []
                for r in resources[:15]:
                    uri = r["@URI"]
                    types = r.get("@types", "")
                    if any(t in types for t in ["Person", "Place", "Organisation", "Work", "Species", "Event"]):
                        entities.append(uri)
                return entities
        except:
            pass
        
        return []
    
    def get_entity_info(self, entity_uri: str) -> Dict:
        query = f"""
        SELECT ?property ?value
        WHERE {{
            <{entity_uri}> ?property ?value .
        }}
        LIMIT 50
        """
        
        try:
            sparql = SPARQLWrapper(self.dbpedia_endpoint)
            sparql.setQuery(query)
            sparql.setReturnFormat(JSON)
            result = sparql.query().convert()
            return result
        except:
            return {}
    
    def get_wikidata_links(self, dbpedia_uris: List[str]) -> List[str]:
        wikidata_entities = []
        for uri in dbpedia_uris[:3]:
            query = f"""
            PREFIX owl: <http://www.w3.org/2002/07/owl#>
            
            SELECT ?wikidata
            WHERE {{
                <{uri}> owl:sameAs ?wikidata .
                FILTER(STRSTARTS(STR(?wikidata), "http://www.wikidata.org/"))
            }}
            LIMIT 1
            """
            try:
                sparql = SPARQLWrapper(self.dbpedia_endpoint)
                sparql.setQuery(query)
                sparql.setReturnFormat(JSON)
                sparql.setTimeout(15)
                result = sparql.query().convert()
                bindings = result.get("results", {}).get("bindings", [])
                if bindings:
                    wikidata_entities.append(bindings[0]["wikidata"]["value"])
            except Exception as e:
                print(f"Wikidata lookup skipped for {uri.split('/')[-1]}")
        
        return wikidata_entities
    
    def search_wikidata(self, search_term: str) -> List[Dict]:
        query = f"""
        SELECT ?item ?itemLabel ?description
        WHERE {{
            ?item rdfs:label "{search_term}"@en .
            ?item schema:description ?description .
            FILTER(LANG(?description) = "en")
            SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
        }}
        LIMIT 5
        """
        
        try:
            sparql = SPARQLWrapper(self.wikidata_endpoint)
            sparql.setQuery(query)
            sparql.setReturnFormat(JSON)
            result = sparql.query().convert()
            return result.get("results", {}).get("bindings", [])
        except:
            return []
