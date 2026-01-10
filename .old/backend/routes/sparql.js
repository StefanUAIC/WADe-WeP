const express = require('express');
const router = express.Router();
const FusekiService = require('../services/fuseki.service');

const fusekiService = new FusekiService();

// POST execute SPARQL query
router.post('/query', async (req, res) => {
  try {
    const { query, format = 'json' } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'SPARQL query is required' });
    }

    const results = await fusekiService.executeSparqlQuery(query, format);
    
    if (format === 'json') {
      res.json(results);
    } else {
      res.set('Content-Type', 'application/rdf+xml');
      res.send(results);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET predefined queries
router.get('/queries', (req, res) => {
  const queries = {
    freshEditorials: {
      name: 'Fresh Editorials on Specific Topic',
      description: 'List recent editorials about a specific topic',
      query: `
PREFIX schema: <http://schema.org/>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX news: <http://news-provenance.org/vocab/>

SELECT ?title ?author ?date ?url
WHERE {
  ?article a schema:NewsArticle ;
           schema:headline ?title ;
           schema:author ?author ;
           schema:datePublished ?date ;
           schema:url ?url ;
           schema:articleSection "Editorial" ;
           schema:about ?topic .
  FILTER(CONTAINS(LCASE(STR(?topic)), LCASE("{{TOPIC}}")))
  FILTER(?date > "{{DATE}}"^^xsd:dateTime)
}
ORDER BY DESC(?date)
LIMIT 20`
    },
    shortArticlesInLanguages: {
      name: 'Short Articles in English or Spanish',
      description: 'Articles under 4000 words in English or Spanish about IT contests',
      query: `
PREFIX schema: <http://schema.org/>
PREFIX dc: <http://purl.org/dc/elements/1.1/>

SELECT ?title ?wordCount ?language ?description
WHERE {
  ?article a schema:NewsArticle ;
           schema:headline ?title ;
           schema:wordCount ?wordCount ;
           schema:inLanguage ?language ;
           schema:description ?description ;
           schema:about ?topic .
  FILTER(?wordCount < 4000)
  FILTER(?language = "en" || ?language = "es")
  FILTER(CONTAINS(LCASE(STR(?topic)), "it contest") || 
         CONTAINS(LCASE(STR(?topic)), "programming competition"))
}
ORDER BY ?wordCount`
    },
    romanianInvestigations: {
      name: 'Romanian Journalists Investigations',
      description: 'Investigations and documentaries by Romanian journalists',
      query: `
PREFIX schema: <http://schema.org/>
PREFIX dc: <http://purl.org/dc/elements/1.1/>

SELECT ?title ?description ?author ?date ?url
WHERE {
  ?article a schema:NewsArticle ;
           schema:headline ?title ;
           schema:description ?description ;
           schema:author ?author ;
           schema:datePublished ?date ;
           schema:url ?url ;
           schema:inLanguage "ro" .
  ?article schema:genre ?genre .
  FILTER(?genre = "Investigation" || ?genre = "Documentary")
  FILTER(CONTAINS(LCASE(STR(?author)), "romanian") || 
         CONTAINS(LCASE(STR(?url)), ".ro"))
}
ORDER BY DESC(?date)`
    },
    articlesByTopic: {
      name: 'Articles by Topic',
      description: 'Find all articles about a specific topic',
      query: `
PREFIX schema: <http://schema.org/>
PREFIX dc: <http://purl.org/dc/elements/1.1/>

SELECT ?title ?author ?date ?description
WHERE {
  ?article a schema:NewsArticle ;
           schema:headline ?title ;
           schema:author ?author ;
           schema:datePublished ?date ;
           schema:description ?description ;
           schema:about ?topic .
  FILTER(CONTAINS(LCASE(STR(?topic)), LCASE("{{TOPIC}}")))
}
ORDER BY DESC(?date)
LIMIT 50`
    },
    multimediaContent: {
      name: 'Multimedia Content',
      description: 'Articles with multimedia content (images, audio, video)',
      query: `
PREFIX schema: <http://schema.org/>

SELECT ?title ?contentType ?url ?thumbnail
WHERE {
  ?article a schema:NewsArticle ;
           schema:headline ?title ;
           schema:url ?url .
  {
    ?article schema:image ?thumbnail .
    BIND("image" AS ?contentType)
  } UNION {
    ?article schema:audio ?audio .
    BIND("audio" AS ?contentType)
  } UNION {
    ?article schema:video ?video .
    BIND("video" AS ?contentType)
  }
}
ORDER BY ?title`
    }
  };

  res.json(queries);
});

// POST execute predefined query
router.post('/queries/:queryName', async (req, res) => {
  try {
    const { queryName } = req.params;
    const { params = {} } = req.body;

    const queries = {
      freshEditorials: (topic, date) => `
PREFIX schema: <http://schema.org/>
SELECT ?title ?author ?date ?url
WHERE {
  ?article a schema:NewsArticle ;
           schema:headline ?title ;
           schema:author ?author ;
           schema:datePublished ?date ;
           schema:url ?url ;
           schema:articleSection "Editorial" ;
           schema:about ?topic .
  FILTER(CONTAINS(LCASE(STR(?topic)), LCASE("${topic}")))
  FILTER(?date > "${date}"^^xsd:dateTime)
}
ORDER BY DESC(?date)
LIMIT 20`,
      
      shortArticles: () => `
PREFIX schema: <http://schema.org/>
SELECT ?title ?wordCount ?language ?description
WHERE {
  ?article a schema:NewsArticle ;
           schema:headline ?title ;
           schema:wordCount ?wordCount ;
           schema:inLanguage ?language ;
           schema:description ?description ;
           schema:about ?topic .
  FILTER(?wordCount < 4000)
  FILTER(?language = "en" || ?language = "es")
  FILTER(CONTAINS(LCASE(STR(?topic)), "it contest"))
}
ORDER BY ?wordCount`
    };

    if (!queries[queryName]) {
      return res.status(404).json({ error: 'Query not found' });
    }

    const query = typeof queries[queryName] === 'function' 
      ? queries[queryName](...Object.values(params))
      : queries[queryName];

    const results = await fusekiService.executeSparqlQuery(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;