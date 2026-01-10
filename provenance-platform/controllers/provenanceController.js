const fusekiService = require('../services/fusekiService');

exports.getEntities = async (req, res) => {
  try {
    const query = `
      PREFIX prov: <http://www.w3.org/ns/prov#>
      PREFIX dcterms: <http://purl.org/dc/terms/>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      
      SELECT DISTINCT ?entity ?title ?type
      WHERE {
        ?entity rdf:type prov:Entity .
        OPTIONAL { ?entity dcterms:title ?title }
        OPTIONAL { ?entity rdf:type ?type FILTER(?type != prov:Entity) }
      }
      LIMIT 100
    `;
    
    const results = await fusekiService.executeSparql(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getActivities = async (req, res) => {
  try {
    const query = `
      PREFIX prov: <http://www.w3.org/ns/prov#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      
      SELECT DISTINCT ?activity ?startTime ?endTime
      WHERE {
        ?activity rdf:type prov:Activity .
        OPTIONAL { ?activity prov:startedAtTime ?startTime }
        OPTIONAL { ?activity prov:endedAtTime ?endTime }
      }
      LIMIT 100
    `;
    
    const results = await fusekiService.executeSparql(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAgents = async (req, res) => {
  try {
    const query = `
      PREFIX prov: <http://www.w3.org/ns/prov#>
      PREFIX foaf: <http://xmlns.com/foaf/0.1/>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      
      SELECT DISTINCT ?agent ?name ?email ?type
      WHERE {
        ?agent rdf:type prov:Agent .
        OPTIONAL { ?agent foaf:name ?name }
        OPTIONAL { ?agent foaf:givenName ?name }
        OPTIONAL { ?agent foaf:mbox ?email }
        OPTIONAL { ?agent rdf:type ?type FILTER(?type != prov:Agent) }
      }
      LIMIT 100
    `;
    
    const results = await fusekiService.executeSparql(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProvenanceGraph = async (req, res) => {
  try {
    const query = `
      PREFIX prov: <http://www.w3.org/ns/prov#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      
      SELECT ?subject ?subjectType ?predicate ?object ?objectType
      WHERE {
        {
          ?subject rdf:type ?subjectType .
          ?subject ?predicate ?object .
          OPTIONAL { ?object rdf:type ?objectType }
          FILTER(?subjectType IN (prov:Entity, prov:Activity, prov:Agent))
          FILTER(?predicate IN (prov:used, prov:wasGeneratedBy, prov:wasAssociatedWith, 
                                prov:wasAttributedTo, prov:wasDerivedFrom, prov:wasRevisionOf,
                                prov:alternateOf, prov:actedOnBehalfOf))
        }
      }
      LIMIT 500
    `;
    
    const results = await fusekiService.executeSparql(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getResource = async (req, res) => {
  try {
    const { uri } = req.query;
    
    const query = `
      PREFIX prov: <http://www.w3.org/ns/prov#>
      PREFIX dcterms: <http://purl.org/dc/terms/>
      PREFIX foaf: <http://xmlns.com/foaf/0.1/>
      
      SELECT ?predicate ?object
      WHERE {
        <${uri}> ?predicate ?object .
      }
    `;
    
    const results = await fusekiService.executeSparql(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.search = async (req, res) => {
  try {
    const { searchTerm } = req.body;
    
    const query = `
      PREFIX prov: <http://www.w3.org/ns/prov#>
      PREFIX dcterms: <http://purl.org/dc/terms/>
      PREFIX foaf: <http://xmlns.com/foaf/0.1/>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      
      SELECT DISTINCT ?resource ?type ?label
      WHERE {
        ?resource rdf:type ?type .
        OPTIONAL { ?resource dcterms:title ?label }
        OPTIONAL { ?resource foaf:name ?label }
        OPTIONAL { ?resource foaf:givenName ?label }
        FILTER(
          CONTAINS(LCASE(STR(?resource)), LCASE("${searchTerm}")) ||
          CONTAINS(LCASE(STR(?label)), LCASE("${searchTerm}"))
        )
        FILTER(?type IN (prov:Entity, prov:Activity, prov:Agent))
      }
      LIMIT 50
    `;
    
    const results = await fusekiService.executeSparql(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const { uri } = req.query;
    
    const query = `
      PREFIX prov: <http://www.w3.org/ns/prov#>
      PREFIX dcterms: <http://purl.org/dc/terms/>
      
      SELECT DISTINCT ?related ?relationship ?title
      WHERE {
        {
          ?related prov:wasDerivedFrom <${uri}> .
          BIND("derivedFrom" AS ?relationship)
        } UNION {
          ?related prov:wasRevisionOf <${uri}> .
          BIND("revisionOf" AS ?relationship)
        } UNION {
          ?related prov:alternateOf <${uri}> .
          BIND("alternateOf" AS ?relationship)
        } UNION {
          <${uri}> prov:wasDerivedFrom ?related .
          BIND("sourceFor" AS ?relationship)
        }
        OPTIONAL { ?related dcterms:title ?title }
      }
      LIMIT 20
    `;
    
    const results = await fusekiService.executeSparql(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const query = `
      PREFIX prov: <http://www.w3.org/ns/prov#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      
      SELECT 
        (COUNT(DISTINCT ?entity) AS ?entities)
        (COUNT(DISTINCT ?activity) AS ?activities)
        (COUNT(DISTINCT ?agent) AS ?agents)
      WHERE {
        OPTIONAL { ?entity rdf:type prov:Entity }
        OPTIONAL { ?activity rdf:type prov:Activity }
        OPTIONAL { ?agent rdf:type prov:Agent }
      }
    `;
    
    const results = await fusekiService.executeSparql(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.healthCheck = async (req, res) => {
  try {
    const health = await fusekiService.checkHealth();
    res.json(health);
  } catch (error) {
    res.status(503).json(error);
  }
};