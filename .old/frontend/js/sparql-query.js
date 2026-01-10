// Predefined SPARQL queries
const predefinedQueries = {
    freshEditorials: `PREFIX schema: <http://schema.org/>
PREFIX dc: <http://purl.org/dc/elements/1.1/>

SELECT ?title ?author ?date ?url
WHERE {
  ?article a schema:NewsArticle ;
           schema:headline ?title ;
           schema:author ?author ;
           schema:datePublished ?date ;
           schema:url ?url ;
           schema:articleSection "Editorial" .
  FILTER(?date > "2024-01-01T00:00:00"^^xsd:dateTime)
}
ORDER BY DESC(?date)
LIMIT 20`,

    shortArticles: `PREFIX schema: <http://schema.org/>

SELECT ?title ?wordCount ?language ?description
WHERE {
  ?article a schema:NewsArticle ;
           schema:headline ?title ;
           schema:wordCount ?wordCount ;
           schema:inLanguage ?language ;
           schema:description ?description .
  FILTER(?wordCount < 4000)
  FILTER(?language = "en" || ?language = "es")
}
ORDER BY ?wordCount
LIMIT 50`,

    romanianInvestigations: `PREFIX schema: <http://schema.org/>

SELECT ?title ?description ?author ?date ?url
WHERE {
  ?article a schema:NewsArticle ;
           schema:headline ?title ;
           schema:description ?description ;
           schema:author ?author ;
           schema:datePublished ?date ;
           schema:url ?url ;
           schema:inLanguage "ro" .
}
ORDER BY DESC(?date)
LIMIT 50`,

    multimediaContent: `PREFIX schema: <http://schema.org/>

SELECT ?title ?contentType ?url ?date
WHERE {
  ?article a schema:NewsArticle ;
           schema:headline ?title ;
           schema:url ?url ;
           schema:datePublished ?date ;
           schema:encodingFormat ?contentType .
  FILTER(?contentType != "text")
}
ORDER BY DESC(?date)
LIMIT 50`
};

// Load a predefined query
function isAlertVisible() {
    const alert = document.querySelector('.alert');
    return alert && alert.offsetParent !== null;
}

function loadQuery(queryName) {
    const textarea = document.getElementById('sparqlQuery');

    if (predefinedQueries[queryName]) {
        textarea.value = predefinedQueries[queryName];

        if (!isAlertVisible()) {
            showAlert('Query loaded. Click "Execute Query" to run it.', 'info');
        }
    } else {
        if (!isAlertVisible()) {
            showAlert('Query not found', 'error');
        }
    }
}
// Execute SPARQL query
async function executeSparqlQuery() {
    const query = document.getElementById('sparqlQuery').value;
    const resultsDiv = document.getElementById('queryResults');

    if (!query.trim()) {
        showAlert('Please enter a SPARQL query', 'error');
        return;
    }

    resultsDiv.innerHTML = '<p>Executing query...</p>';

    try {
        const response = await fetch(`${API_BASE}/sparql/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/sparql-results+json, application/json, text/plain'
            },
            body: JSON.stringify({
                query: query,
                format: 'json'
            })
        });

        // 👇 Read response body FIRST
        const responseText = await response.text();

        if (!response.ok) {
            let errorMessage = responseText;

            // Try to parse JSON error if possible
            try {
                const errorJson = JSON.parse(responseText);
                errorMessage =
                    errorJson.error ||
                    errorJson.message ||
                    errorJson.details ||
                    responseText;
            } catch {
                // Not JSON → keep plain text
            }

            throw new Error(errorMessage);
        }

        const results = JSON.parse(responseText);
        displayQueryResults(results);

    } catch (error) {
        resultsDiv.innerHTML = `
            <div class="alert alert-danger">
                <strong>Query error:</strong><br>
                <pre style="white-space: pre-wrap; margin: 0;">${error.message}</pre>
            </div>
        `;
    }
}

// Display query results
function displayQueryResults(results) {
    const resultsDiv = document.getElementById('queryResults');
    
    if (!results.results || !results.results.bindings || results.results.bindings.length === 0) {
        resultsDiv.innerHTML = '<p class="alert alert-info">No results found</p>';
        return;
    }
    
    const bindings = results.results.bindings;
    const vars = results.head.vars;
    
    let html = `
        <h3>Query Results (${bindings.length} rows)</h3>
        <div style="overflow-x: auto;">
            <table class="results-table">
                <thead>
                    <tr>
                        ${vars.map(v => `<th>${v.charAt(0).toUpperCase() + v.slice(1)}</th>`).join('')}
                    </tr>

                </thead>
                <tbody>
                    ${bindings.map(binding => `
                        <tr>
                            ${vars.map(v => {
                                const value = binding[v];
                                if (!value) return '<td>-</td>';
                                
                                if (value.type === 'uri') {
                                    return `<td><a href="${value.value}" target="_blank">${value.value}</a></td>`;
                                } else if (value.datatype === 'http://www.w3.org/2001/XMLSchema#dateTime') {
                                    return `<td>${formatDate(value.value)}</td>`;
                                } else {
                                    return `<td>${value.value}</td>`;
                                }
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div style="margin-top: 1rem;">
            <button onclick="downloadQueryResults()" class="btn btn-secondary">Download as JSON</button>
            <button onclick="downloadQueryResultsCSV()" class="btn btn-secondary">Download as CSV</button>
        </div>
    `;
    
    resultsDiv.innerHTML = html;
    
    // Store results for download
    window.lastQueryResults = results;
}

// Download query results as JSON
function downloadQueryResults() {
    if (!window.lastQueryResults) {
        showAlert('No results to download', 'error');
        return;
    }
    
    const blob = new Blob([JSON.stringify(window.lastQueryResults, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sparql-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Download query results as CSV
function downloadQueryResultsCSV() {
    if (!window.lastQueryResults) {
        showAlert('No results to download', 'error');
        return;
    }
    
    const results = window.lastQueryResults;
    const vars = results.head.vars;
    const bindings = results.results.bindings;
    
    // Create CSV header
    let csv = vars.join(',') + '\n';
    
    // Create CSV rows
    bindings.forEach(binding => {
        const row = vars.map(v => {
            const value = binding[v];
            if (!value) return '';
            const val = value.value.replace(/"/g, '""'); // Escape quotes
            return `"${val}"`;
        });
        csv += row.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sparql-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// Get available predefined queries
async function loadPredefinedQueries() {
    try {
        const response = await fetch(`${API_BASE}/sparql/queries`);
        const queries = await response.json();
        
        console.log('Available predefined queries:', queries);
    } catch (error) {
        console.error('Error loading predefined queries:', error);
    }
}

// Load predefined queries on page load
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".btn-query").forEach(btn => {
        btn.addEventListener("click", () => {
            const queryName = btn.dataset.query;
            console.log(btn.dataset.query);
            loadQuery(queryName);
        });
    });
    const executeBtn = document.getElementById("btnExecuteQuery");
    if (executeBtn) {
        executeBtn.addEventListener("click", () => {
            executeSparqlQuery();
        });
    }

      // Refresh button
    document.getElementById("btnRefreshArticles")
        ?.addEventListener("click", () => {
            loadArticles();
        });

    // Language filter
    document.getElementById("languageFilter")
        ?.addEventListener("change", () => {
            filterArticles();
        });

    // Topic filter (typing)
    document.getElementById("topicFilter")
        ?.addEventListener("input", () => {
            filterArticles();
        });
});
// Make functions globally available
window.loadQuery = loadQuery;
window.executeSparqlQuery = executeSparqlQuery;
window.downloadQueryResults = downloadQueryResults;
window.downloadQueryResultsCSV = downloadQueryResultsCSV;