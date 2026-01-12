import os
import requests
from requests.auth import HTTPBasicAuth
from SPARQLWrapper import SPARQLWrapper, JSON, POST, DIGEST
from typing import List, Dict, Any
from datetime import datetime
import uuid

class FusekiService:
    def __init__(self, fuseki_url: str):
        self.base_url = fuseki_url
        self.dataset = "news-provenance"
        self.sparql_endpoint = f"{fuseki_url}/{self.dataset}/sparql"
        self.update_endpoint = f"{fuseki_url}/{self.dataset}/update"
        self.username = os.getenv("FUSEKI_USERNAME", "admin")
        self.password = os.getenv("FUSEKI_PASSWORD", "admin123")
        self.auth = HTTPBasicAuth(self.username, self.password)
        self.namespace = os.getenv("BASE_URL", "http://localhost:8000")
        
    def check_connection(self) -> bool:
        try:
            response = requests.get(f"{self.base_url}/$/ping", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def execute_sparql(self, query: str) -> Dict[str, Any]:
        sparql = SPARQLWrapper(self.sparql_endpoint)
        sparql.setQuery(query)
        sparql.setReturnFormat(JSON)
        return sparql.query().convert()
    
    def execute_update(self, update_query: str) -> bool:
        try:
            headers = {"Content-Type": "application/sparql-update"}
            response = requests.post(
                self.update_endpoint,
                data=update_query,
                headers=headers,
                auth=self.auth,
                timeout=10
            )
            return response.status_code in [200, 201, 204]
        except Exception as e:
            print(f"Update error: {e}")
            return False
    
    def get_articles(self) -> List[Dict]:
        query = """
        PREFIX prov: <http://www.w3.org/ns/prov#>
        PREFIX dcterms: <http://purl.org/dc/terms/>
        PREFIX schema: <http://schema.org/>
        PREFIX wep: <http://example.org/wep/>
        
        SELECT ?article ?title ?author ?content ?publication ?language ?created
        WHERE {
            ?article a schema:NewsArticle ;
                     schema:headline ?title ;
                     schema:author ?author ;
                     schema:articleBody ?content ;
                     schema:publisher ?publication ;
                     schema:inLanguage ?language ;
                     schema:dateCreated ?created .
        }
        ORDER BY DESC(?created)
        LIMIT 50
        """
        result = self.execute_sparql(query)
        articles = []
        for binding in result.get("results", {}).get("bindings", []):
            articles.append({
                "id": binding["article"]["value"].split("/")[-1],
                "title": binding["title"]["value"],
                "author": binding["author"]["value"],
                "content": binding["content"]["value"],
                "publication": binding["publication"]["value"],
                "language": binding["language"]["value"],
                "created_at": binding["created"]["value"]
            })
        return articles
    
    def create_article(self, article_data: Dict) -> Dict:
        article_id = str(uuid.uuid4())
        article_uri = f"{self.namespace}/article/{article_id}"
        activity_uri = f"{self.namespace}/activity/{uuid.uuid4()}"
        agent_uri = f"{self.namespace}/agent/{uuid.uuid4()}"
        
        now = datetime.utcnow().isoformat() + "Z"
        
        def escape_sparql(s):
            return s.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n').replace('\r', '\\r')
        
        title = escape_sparql(article_data['title'])
        author = escape_sparql(article_data['author'])
        content = escape_sparql(article_data['content'])
        publication = escape_sparql(article_data['publication'])
        language = article_data.get('language', 'en')
        
        keywords_triples = ""
        if article_data.get("keywords"):
            for kw in article_data["keywords"]:
                keywords_triples += f'    schema:keywords "{escape_sparql(kw)}" ;\n'
        
        iptc_triples = ""
        if article_data.get("iptc_subjects"):
            for subj in article_data["iptc_subjects"]:
                iptc_triples += f'    iptc:subject "{escape_sparql(subj)}" ;\n'
        
        dbpedia_triples = ""
        if article_data.get("dbpedia_entities"):
            for entity in article_data["dbpedia_entities"]:
                dbpedia_triples += f'    wep:relatedEntity <{entity}> ;\n'
        
        if article_data.get("wikidata_entities"):
            for entity in article_data["wikidata_entities"]:
                dbpedia_triples += f'    wep:wikidataEntity <{entity}> ;\n'
                dbpedia_triples += f'    wep:relatedEntity <{entity}> ;\n'
        
        multimedia_triples = ""
        if article_data.get("image_urls"):
            for img_url in article_data["image_urls"]:
                if img_url:
                    multimedia_triples += f'    schema:image <{img_url}> ;\n'
        if article_data.get("video_urls"):
            for vid_url in article_data["video_urls"]:
                if vid_url:
                    multimedia_triples += f'    schema:video <{vid_url}> ;\n'
        if article_data.get("audio_urls"):
            for aud_url in article_data["audio_urls"]:
                if aud_url:
                    multimedia_triples += f'    schema:audio <{aud_url}> ;\n'
        
        derivation_triples = ""
        if article_data.get("based_on_article_id"):
            based_uri = f"{self.namespace}/article/{article_data['based_on_article_id']}"
            dtype = article_data.get("derivation_type", "Derivation")
            if dtype == "Translation":
                derivation_triples += f'    prov:wasRevisionOf <{based_uri}> ;\n'
            elif dtype == "Revision":
                derivation_triples += f'    prov:wasRevisionOf <{based_uri}> ;\n'
            else:
                derivation_triples += f'    prov:wasDerivedFrom <{based_uri}> ;\n'
        
        if article_data.get("url"):
            derivation_triples += f'    prov:wasDerivedFrom <{article_data["url"]}> ;\n'
        
        insert_query = f"""
        PREFIX prov: <http://www.w3.org/ns/prov#>
        PREFIX dc: <http://purl.org/dc/elements/1.1/>
        PREFIX dcterms: <http://purl.org/dc/terms/>
        PREFIX schema: <http://schema.org/>
        PREFIX iptc: <http://iptc.org/std/Iptc4xmpExt/2008-02-29/>
        PREFIX wep: <http://example.org/wep/>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        
        INSERT DATA {{
            <{article_uri}> a schema:NewsArticle, prov:Entity ;
                dc:title "{title}" ;
                schema:headline "{title}" ;
                dc:creator "{author}" ;
                schema:author "{author}" ;
                schema:articleBody "{content}" ;
                dc:publisher "{publication}" ;
                schema:publisher "{publication}" ;
                dc:language "{language}" ;
                schema:inLanguage "{language}" ;
                dcterms:created "{now}"^^xsd:dateTime ;
                schema:dateCreated "{now}"^^xsd:dateTime ;
                {keywords_triples}
                {iptc_triples}
                {dbpedia_triples}
                {multimedia_triples}
                {derivation_triples}
                prov:wasGeneratedBy <{activity_uri}> .
            
            <{activity_uri}> a prov:Activity ;
                prov:startedAtTime "{now}"^^xsd:dateTime ;
                prov:endedAtTime "{now}"^^xsd:dateTime ;
                prov:wasAssociatedWith <{agent_uri}> .
            
            <{agent_uri}> a prov:Agent, schema:Person ;
                schema:name "{author}" .
        }}
        """
        
        success = self.execute_update(insert_query)
        if success:
            return {
                "id": article_id,
                "title": article_data["title"],
                "author": article_data["author"],
                "content": article_data["content"],
                "publication": article_data["publication"],
                "language": language,
                "keywords": article_data.get("keywords", []),
                "created_at": now,
                "dbpedia_entities": article_data.get("dbpedia_entities", [])
            }
        return None
    
    def get_article_with_provenance(self, article_id: str) -> Dict:
        article_uri = f"{self.namespace}/article/{article_id}"
        query = f"""
        PREFIX prov: <http://www.w3.org/ns/prov#>
        PREFIX schema: <http://schema.org/>
        PREFIX wep: <http://example.org/wep/>
        
        SELECT ?title ?author ?content ?publication ?language ?created 
               ?image ?video ?audio
               ?activity ?agent ?agentName
        WHERE {{
            <{article_uri}> a schema:NewsArticle ;
                schema:headline ?title ;
                schema:author ?author ;
                schema:articleBody ?content ;
                schema:publisher ?publication ;
                schema:inLanguage ?language ;
                schema:dateCreated ?created .
            
            OPTIONAL {{ <{article_uri}> schema:image ?image . }}
            OPTIONAL {{ <{article_uri}> schema:video ?video . }}
            OPTIONAL {{ <{article_uri}> schema:audio ?audio . }}
            
            OPTIONAL {{
                <{article_uri}> prov:wasGeneratedBy ?activity .
                ?activity prov:wasAssociatedWith ?agent .
                ?agent schema:name ?agentName .
            }}
        }}
        """
        result = self.execute_sparql(query)
        bindings = result.get("results", {}).get("bindings", [])
        if bindings:
            b = bindings[0]
            
            image_urls = list(set([binding["image"]["value"] for binding in bindings if "image" in binding]))
            video_urls = list(set([binding["video"]["value"] for binding in bindings if "video" in binding]))
            audio_urls = list(set([binding["audio"]["value"] for binding in bindings if "audio" in binding]))
            
            article_data = {
                "id": article_id,
                "title": b["title"]["value"],
                "author": b["author"]["value"],
                "content": b["content"]["value"],
                "publication": b["publication"]["value"],
                "language": b["language"]["value"],
                "created_at": b["created"]["value"],
                "keywords": [],
                "image_urls": image_urls,
                "video_urls": video_urls,
                "audio_urls": audio_urls
            }
            
            if "activity" in b:
                article_data["provenance"] = {
                    "activity": b["activity"]["value"],
                    "agent": b["agent"]["value"],
                    "agent_name": b["agentName"]["value"]
                }
            
            return article_data
        return None
    
    def get_recommendations(self, article_id: str) -> List[Dict]:
        article_uri = f"{self.namespace}/article/{article_id}"
        query = f"""
        PREFIX schema: <http://schema.org/>
        
        SELECT ?article ?title ?author ?publication
        WHERE {{
            <{article_uri}> schema:keywords ?keyword .
            ?article a schema:NewsArticle ;
                     schema:keywords ?keyword ;
                     schema:headline ?title ;
                     schema:author ?author ;
                     schema:publisher ?publication .
            FILTER(?article != <{article_uri}>)
        }}
        LIMIT 5
        """
        result = self.execute_sparql(query)
        recommendations = []
        for binding in result.get("results", {}).get("bindings", []):
            recommendations.append({
                "id": binding["article"]["value"].split("/")[-1],
                "title": binding["title"]["value"],
                "author": binding["author"]["value"],
                "publication": binding["publication"]["value"]
            })
        return recommendations
    
    def get_article_rdf(self, article_id: str, format: str = "turtle") -> str:
        article_uri = f"{self.namespace}/article/{article_id}"
        query = f"""
        CONSTRUCT {{
            ?s ?p ?o .
        }}
        WHERE {{
            {{
                <{article_uri}> ?p ?o .
                BIND(<{article_uri}> AS ?s)
            }}
            UNION
            {{
                <{article_uri}> ?rel ?activity .
                ?activity ?p ?o .
                BIND(?activity AS ?s)
            }}
        }}
        """
        try:
            sparql = SPARQLWrapper(self.sparql_endpoint)
            sparql.setQuery(query)
            if format == "turtle":
                sparql.setReturnFormat("turtle")
            elif format == "xml":
                sparql.setReturnFormat("xml")
            elif format == "n3":
                sparql.setReturnFormat("n3")
            else:
                sparql.setReturnFormat("turtle")
            return sparql.query().convert().decode('utf-8')
        except:
            return None
    
    def get_statistics(self) -> Dict:
        queries = {
            "total_articles": """
                PREFIX schema: <http://schema.org/>
                SELECT (COUNT(?article) AS ?count)
                WHERE { ?article a schema:NewsArticle . }
            """,
            "total_authors": """
                PREFIX schema: <http://schema.org/>
                SELECT (COUNT(DISTINCT ?author) AS ?count)
                WHERE { ?article a schema:NewsArticle ; schema:author ?author . }
            """,
            "articles_by_language": """
                PREFIX schema: <http://schema.org/>
                SELECT ?language (COUNT(?article) AS ?count)
                WHERE { ?article a schema:NewsArticle ; schema:inLanguage ?language . }
                GROUP BY ?language
            """,
            "top_keywords": """
                PREFIX schema: <http://schema.org/>
                SELECT ?keyword (COUNT(?article) AS ?count)
                WHERE { ?article a schema:NewsArticle ; schema:keywords ?keyword . }
                GROUP BY ?keyword
                ORDER BY DESC(?count)
                LIMIT 10
            """
        }
        
        stats = {}
        for key, query in queries.items():
            result = self.execute_sparql(query)
            bindings = result.get("results", {}).get("bindings", [])
            if key in ["total_articles", "total_authors"]:
                stats[key] = int(bindings[0]["count"]["value"]) if bindings else 0
            else:
                stats[key] = [
                    {k: b[k]["value"] for k in b.keys()}
                    for b in bindings
                ]
        
        return stats
    
    def search_articles(self, search_term: str, language: str = None) -> List[Dict]:
        lang_filter = f'FILTER(?language = "{language}")' if language else ""
        
        query = f"""
        PREFIX schema: <http://schema.org/>
        
        SELECT ?article ?title ?author ?content ?publication ?language
        WHERE {{
            ?article a schema:NewsArticle ;
                     schema:headline ?title ;
                     schema:author ?author ;
                     schema:articleBody ?content ;
                     schema:publisher ?publication ;
                     schema:inLanguage ?language .
            FILTER(
                CONTAINS(LCASE(?title), LCASE("{search_term}")) ||
                CONTAINS(LCASE(?content), LCASE("{search_term}")) ||
                CONTAINS(LCASE(?author), LCASE("{search_term}"))
            )
            {lang_filter}
        }}
        LIMIT 20
        """
        
        result = self.execute_sparql(query)
        articles = []
        for binding in result.get("results", {}).get("bindings", []):
            articles.append({
                "id": binding["article"]["value"].split("/")[-1],
                "title": binding["title"]["value"],
                "author": binding["author"]["value"],
                "content": binding["content"]["value"][:200] + "...",
                "publication": binding["publication"]["value"],
                "language": binding["language"]["value"]
            })
        return articles
    
    def get_full_provenance_chain(self, article_id: str) -> Dict:
        article_uri = f"{self.namespace}/article/{article_id}"
        query = f"""
        PREFIX prov: <http://www.w3.org/ns/prov#>
        PREFIX schema: <http://schema.org/>
        PREFIX wep: <http://example.org/wep/>
        
        SELECT ?activity ?agent ?agentName ?startTime ?endTime
               ?derivedFrom ?relatedEntity ?wikidataEntity
        WHERE {{
            <{article_uri}> prov:wasGeneratedBy ?activity .
            ?activity prov:wasAssociatedWith ?agent ;
                      prov:startedAtTime ?startTime ;
                      prov:endedAtTime ?endTime .
            ?agent schema:name ?agentName .
            
            OPTIONAL {{ <{article_uri}> prov:wasDerivedFrom ?derivedFrom . }}
            OPTIONAL {{ <{article_uri}> wep:relatedEntity ?relatedEntity . }}
            OPTIONAL {{ <{article_uri}> wep:wikidataEntity ?wikidataEntity . }}
        }}
        """
        
        result = self.execute_sparql(query)
        bindings = result.get("results", {}).get("bindings", [])
        
        if bindings:
            b = bindings[0]
            chain = {
                "entity": {
                    "uri": article_uri,
                    "type": "NewsArticle"
                },
                "activity": {
                    "uri": b["activity"]["value"],
                    "startTime": b["startTime"]["value"],
                    "endTime": b["endTime"]["value"]
                },
                "agent": {
                    "uri": b["agent"]["value"],
                    "name": b["agentName"]["value"]
                }
            }
            
            derived_from = []
            related_entities = []
            wikidata_entities = []
            
            for binding in bindings:
                if "derivedFrom" in binding:
                    uri = binding["derivedFrom"]["value"]
                    if uri not in derived_from:
                        derived_from.append(uri)
                
                if "relatedEntity" in binding:
                    uri = binding["relatedEntity"]["value"]
                    if uri not in related_entities:
                        related_entities.append(uri)
                
                if "wikidataEntity" in binding:
                    uri = binding["wikidataEntity"]["value"]
                    if uri not in wikidata_entities:
                        wikidata_entities.append(uri)
            
            if derived_from:
                chain["derived_from"] = derived_from
            if related_entities:
                chain["related_entities"] = related_entities[:5]
            if wikidata_entities:
                chain["wikidata_entities"] = wikidata_entities[:3]
            
            return chain
        
        return {}
