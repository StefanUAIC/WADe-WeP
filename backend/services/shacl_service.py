from pyshacl import validate
from rdflib import Graph, Namespace, RDF, RDFS, Literal
from typing import Dict, Tuple

PROV = Namespace("http://www.w3.org/ns/prov#")
SCHEMA = Namespace("http://schema.org/")
WEP = Namespace("http://example.org/wep/")
SH = Namespace("http://www.w3.org/ns/shacl#")

class SHACLService:
    
    @staticmethod
    def get_shapes_graph() -> Graph:
        g = Graph()
        g.bind("sh", SH)
        g.bind("schema", SCHEMA)
        g.bind("prov", PROV)
        
        article_shape = WEP.NewsArticleShape
        g.add((article_shape, RDF.type, SH.NodeShape))
        g.add((article_shape, SH.targetClass, SCHEMA.NewsArticle))
        
        g.add((article_shape, SH.property, WEP.headlineProperty))
        g.add((WEP.headlineProperty, SH.path, SCHEMA.headline))
        g.add((WEP.headlineProperty, SH.minCount, Literal(1)))
        g.add((WEP.headlineProperty, SH.datatype, RDFS.Literal))
        
        g.add((article_shape, SH.property, WEP.authorProperty))
        g.add((WEP.authorProperty, SH.path, SCHEMA.author))
        g.add((WEP.authorProperty, SH.minCount, Literal(1)))
        
        g.add((article_shape, SH.property, WEP.provenanceProperty))
        g.add((WEP.provenanceProperty, SH.path, PROV.wasGeneratedBy))
        g.add((WEP.provenanceProperty, SH.minCount, Literal(1)))
        
        return g
    
    @staticmethod
    def validate_rdf(data_graph: Graph) -> Tuple[bool, Graph, str]:
        shapes_graph = SHACLService.get_shapes_graph()
        
        conforms, results_graph, results_text = validate(
            data_graph,
            shacl_graph=shapes_graph,
            inference='rdfs',
            abort_on_first=False
        )
        
        return conforms, results_graph, results_text
    
    @staticmethod
    def validate_article_data(article_rdf: str) -> Dict:
        data_graph = Graph()
        data_graph.parse(data=article_rdf, format="turtle")
        
        conforms, results_graph, results_text = SHACLService.validate_rdf(data_graph)
        
        return {
            "conforms": conforms,
            "results_text": results_text,
            "validation_report": results_graph.serialize(format="turtle")
        }
