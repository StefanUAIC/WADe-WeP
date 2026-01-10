const axios = require('axios');

class FusekiService {
  constructor() {
    this.fusekiUrl = process.env.FUSEKI_URL || 'http://localhost:3030';
    this.dataset = process.env.FUSEKI_DATASET || 'news-provenance';
    this.queryEndpoint = `${this.fusekiUrl}/${this.dataset}/query`;
    this.updateEndpoint = `${this.fusekiUrl}/${this.dataset}/update`;
    this.dataEndpoint = `${this.fusekiUrl}/${this.dataset}/data`;
  }

  async executeSparqlQuery(query, format = 'json') {
    try {
      const response = await axios({
        method: 'POST',
        url: this.queryEndpoint,
        headers: {
          'Content-Type': 'application/sparql-query',
          'Accept': format === 'json' ? 'application/sparql-results+json' : 'application/rdf+xml'
        },
        data: query
      });
      return response.data;
    } catch (error) {
      throw new Error(`SPARQL query failed: ${error.message} \n ${error.response.data}`);
    }
  }

  async executeSparqlUpdate(query) {
    try {
      const response = await axios({
        method: 'POST',
        url: this.updateEndpoint,
        headers: {
          'Content-Type': 'application/sparql-update'
        },
        data: query
      });
      return response.data;
    } catch (error) {
      console.error('SPARQL Update Error:', error.response?.data || error.message);
      throw new Error(`SPARQL update failed: ${error.message}`);
    }
  }

  async insertArticle(rdfData) {
    // Remove @prefix declarations and wrap in INSERT DATA
    const cleanRdf = rdfData
      .split('\n')
      .filter(line => !line.trim().startsWith('@prefix'))
      .join('\n')
      .trim();
    
    const updateQuery = `
PREFIX schema: <http://schema.org/>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

INSERT DATA {
${cleanRdf}
}
`;
    
    console.log('Executing INSERT query:', updateQuery);
    return this.executeSparqlUpdate(updateQuery);
  }

  async updateArticle(articleId, rdfData) {
    // First delete existing data
    const deleteQuery = `
PREFIX schema: <http://schema.org/>
DELETE WHERE {
  <http://news-provenance.org/article/${articleId}> ?p ?o .
}
`;
    
    await this.executeSparqlUpdate(deleteQuery);
    
    // Then insert new data
    return this.insertArticle(rdfData);
  }

  async deleteArticle(articleId) {
    const deleteQuery = `
PREFIX schema: <http://schema.org/>
DELETE WHERE {
  <http://news-provenance.org/article/${articleId}> ?p ?o .
}
`;
    return this.executeSparqlUpdate(deleteQuery);
  }

  async getArticleById(articleId) {
    const query = `
PREFIX schema: <http://schema.org/>
PREFIX dc: <http://purl.org/dc/elements/1.1/>

SELECT ?title ?content ?author ?date ?language ?contentType ?description ?wordCount ?url
WHERE {
  <http://news-provenance.org/article/${articleId}> a schema:NewsArticle ;
    schema:headline ?title ;
    schema:articleBody ?content ;
    schema:author ?authorUri ;
    schema:datePublished ?date ;
    schema:inLanguage ?language ;
    schema:description ?description ;
    schema:url ?url .
  ?authorUri schema:name ?author .
  OPTIONAL { <http://news-provenance.org/article/${articleId}> schema:wordCount ?wordCount }
  OPTIONAL { <http://news-provenance.org/article/${articleId}> schema:encodingFormat ?contentType }
}
LIMIT 1
`;
    
    const results = await this.executeSparqlQuery(query);
    
    if (results.results.bindings.length === 0) {
      return null;
    }
    
    const binding = results.results.bindings[0];
    return {
      id: articleId,
      title: binding.title?.value,
      content: binding.content?.value,
      author: binding.author?.value,
      date: binding.date?.value,
      language: binding.language?.value,
      contentType: binding.contentType?.value,
      description: binding.description?.value,
      wordCount: binding.wordCount?.value,
      url: binding.url?.value
    };
  }

  async getAllArticles(filters = {}) {
    const { language, topic, limit = 50 } = filters;
    
    let filterClauses = [];
    if (language) {
      filterClauses.push(`FILTER(?language = "${language}")`);
    }
    if (topic) {
      filterClauses.push(`FILTER(CONTAINS(LCASE(?description), LCASE("${topic}")) || CONTAINS(LCASE(?title), LCASE("${topic}")))`);
    }
    
    const query = `
PREFIX schema: <http://schema.org/>

SELECT ?id ?title ?author ?date ?language ?description
WHERE {
  ?article a schema:NewsArticle ;
    schema:headline ?title ;
    schema:author ?authorUri ;
    schema:datePublished ?date ;
    schema:inLanguage ?language ;
    schema:description ?description .
  ?authorUri schema:name ?author .
  BIND(REPLACE(STR(?article), "http://news-provenance.org/article/", "") AS ?id)
  ${filterClauses.join('\n  ')}
}
ORDER BY DESC(?date)
LIMIT ${limit}
`;
    
    const results = await this.executeSparqlQuery(query);
    
    return results.results.bindings.map(binding => ({
      id: binding.id?.value,
      title: binding.title?.value,
      author: binding.author?.value,
      date: binding.date?.value,
      language: binding.language?.value,
      description: binding.description?.value
    }));
  }

  async getArticleMetadata(articleId) {
    const query = `
PREFIX schema: <http://schema.org/>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX dcterms: <http://purl.org/dc/terms/>

SELECT ?property ?value
WHERE {
  <http://news-provenance.org/article/${articleId}> ?property ?value .
}
`;
    
    const results = await this.executeSparqlQuery(query);
    return results.results.bindings;
  }
}

module.exports = FusekiService;