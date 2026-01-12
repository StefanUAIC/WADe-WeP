import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function SPARQLQuery() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const exampleQueries = [
    {
      name: "All articles",
      query: `PREFIX schema: <http://schema.org/>
SELECT ?article ?title ?author
WHERE {
  ?article a schema:NewsArticle ;
           schema:headline ?title ;
           schema:author ?author .
}
LIMIT 10`
    },
    {
      name: "Articles in English",
      query: `PREFIX schema: <http://schema.org/>
SELECT ?article ?title ?language
WHERE {
  ?article a schema:NewsArticle ;
           schema:headline ?title ;
           schema:inLanguage ?language .
  FILTER(?language = "en")
}`
    },
    {
      name: "Articles with provenance",
      query: `PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX schema: <http://schema.org/>
SELECT ?article ?title ?activity ?agent
WHERE {
  ?article a schema:NewsArticle ;
           schema:headline ?title ;
           prov:wasGeneratedBy ?activity .
  ?activity prov:wasAssociatedWith ?agent .
}`
    }
  ];

  const executeQuery = async (e) => {
    e.preventDefault();
    setError(null);
    setResults(null);

    try {
      const response = await axios.post(`${API_URL}/api/sparql/query`, { query });
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Query execution failed');
    }
  };

  const loadExample = (exampleQuery) => {
    setQuery(exampleQuery);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <nav aria-label="Breadcrumb" style={{ marginBottom: '20px' }}>
        <Link to="/" style={{ color: '#0066cc', textDecoration: 'none' }}>← Back to Articles</Link>
      </nav>

      <header style={{ marginBottom: '30px' }}>
        <h1>SPARQL Query Interface</h1>
        <p style={{ color: '#666' }}>
          Query the RDF knowledge base using SPARQL 1.1
        </p>
      </header>

      <section aria-labelledby="examples-heading" style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2 id="examples-heading">Example Queries</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {exampleQueries.map((ex, i) => (
            <button
              key={i}
              onClick={() => loadExample(ex.query)}
              style={{ padding: '8px 16px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
            >
              {ex.name}
            </button>
          ))}
        </div>
      </section>

      <form onSubmit={executeQuery} style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <label htmlFor="sparql-query" style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          SPARQL Query
        </label>
        <textarea
          id="sparql-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your SPARQL query here..."
          rows="12"
          style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px' }}
        />
        
        <button 
          type="submit"
          style={{ marginTop: '10px', padding: '10px 30px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Execute Query
        </button>
      </form>

      {error && (
        <div role="alert" style={{ background: '#ffebee', color: '#c62828', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {results && (
        <section aria-labelledby="results-heading" style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
          <h2 id="results-heading">Query Results</h2>
          <p style={{ color: '#666', marginBottom: '15px' }}>
            Found {results.results?.bindings?.length || 0} results
          </p>
          
          {results.results?.bindings?.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    {results.head.vars.map((v) => (
                      <th key={v} style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                        {v}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.results.bindings.map((binding, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      {results.head.vars.map((v) => (
                        <td key={v} style={{ padding: '10px' }}>
                          {binding[v]?.value || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No results found</p>
          )}
        </section>
      )}
    </div>
  );
}

export default SPARQLQuery;
