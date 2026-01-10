document.addEventListener('DOMContentLoaded', () => {

    const editor = document.getElementById('queryEditor');
    const resultsContainer = document.getElementById('resultsContainer');
    const queryInfo = document.getElementById('queryInfo');
    





    let currentResults = null;

    /* ---------- Example queries ---------- */

    const examples = {
    entities: `PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?entity ?title ?type
WHERE {
  ?entity rdf:type prov:Entity .
  OPTIONAL { ?entity dcterms:title ?title }
  OPTIONAL { ?entity rdf:type ?type FILTER(?type != prov:Entity) }
}
LIMIT 50`,

    provenance: `PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX dcterms: <http://purl.org/dc/terms/>

SELECT ?entity ?title ?activity ?used
WHERE {
  ?entity a prov:Entity ;
          prov:wasGeneratedBy ?activity .
  OPTIONAL { ?entity dcterms:title ?title }
  OPTIONAL { ?activity prov:used ?used }
}
LIMIT 50`,

    agents: `PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>

SELECT ?agent ?name ?activity ?role
WHERE {
  ?agent a prov:Agent .
  ?activity prov:wasAssociatedWith ?agent .
  OPTIONAL { ?agent foaf:name ?name }
  OPTIONAL { ?agent foaf:givenName ?name }
  OPTIONAL {
    ?activity prov:qualifiedAssociation ?assoc .
    ?assoc prov:agent ?agent ;
           prov:hadRole ?role .
  }
}
LIMIT 50`,

    derivation: `PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX dcterms: <http://purl.org/dc/terms/>

SELECT ?derived ?derivedTitle ?source ?sourceTitle ?relationship
WHERE {
  {
    ?derived prov:wasDerivedFrom ?source .
    BIND("wasDerivedFrom" AS ?relationship)
  } UNION {
    ?derived prov:wasRevisionOf ?source .
    BIND("wasRevisionOf" AS ?relationship)
  } UNION {
    ?derived prov:alternateOf ?source .
    BIND("alternateOf" AS ?relationship)
  }
  OPTIONAL { ?derived dcterms:title ?derivedTitle }
  OPTIONAL { ?source dcterms:title ?sourceTitle }
}
LIMIT 50`,

    timeline: `PREFIX prov: <http://www.w3.org/ns/prov#>

SELECT ?activity ?startTime ?endTime
WHERE {
  ?activity a prov:Activity .
  OPTIONAL { ?activity prov:startedAtTime ?startTime }
  OPTIONAL { ?activity prov:endedAtTime ?endTime }
  FILTER(BOUND(?startTime) || BOUND(?endTime))
}
ORDER BY ?startTime
LIMIT 50`,

    complex: `PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>

SELECT ?entity ?title ?agent ?agentName ?organization ?orgName
WHERE {
  ?entity a prov:Entity ;
          prov:wasAttributedTo ?agent .
  OPTIONAL { ?entity dcterms:title ?title }
  OPTIONAL { ?agent foaf:name ?agentName }
  OPTIONAL { ?agent foaf:givenName ?agentName }
  OPTIONAL {
    ?agent prov:actedOnBehalfOf ?organization .
    ?organization foaf:name ?orgName .
  }
}
LIMIT 50`
};


    document.body.addEventListener('click', e => {

        const action = e.target.dataset.action;
        const example = e.target.dataset.example;
        const tab = e.target.dataset.tab;

        if (action) handleAction(action);
        if (example) editor.value = examples[example];
        if (tab) switchTab(tab);

        if (e.target.matches('a[data-uri]')) {
            navigator.clipboard.writeText(e.target.dataset.uri);
            showNotification('Copied to clipboard', 'success');
        }
    });

    /* ---------- Actions ---------- */

    function handleAction(action) {
        if (action === 'execute') executeQuery();
        if (action === 'clear') clearQuery();
        if (action === 'format') formatQuery();
        if (action === 'save') saveQuery();
        if (action === 'export') exportCSV();
    }

    async function executeQuery() {
        const query = editor.value.trim();
        if (!query) return showNotification('Enter a query', 'warning');

        const start = performance.now();
        const res = await fetch('/api/sparql/query', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ query })
        });

        const data = await res.json();
        const end = performance.now();

        currentResults = data;
        renderResults(data);

        queryInfo.hidden = false;
        document.getElementById('execTime').textContent = `${(end-start).toFixed(1)}ms`;
        document.getElementById('resultCount').textContent = data.results.bindings.length;
    }

    function renderResults(data) {
        resultsContainer.hidden = false;
        document.getElementById('jsonResults').textContent =
            JSON.stringify(data, null, 2);
    }

    function switchTab(tab) {
        document.querySelectorAll('.results-tab').forEach(b =>
            b.classList.toggle('active', b.dataset.tab === tab)
        );
        document.querySelectorAll('.results-content').forEach(c =>
            c.classList.toggle('active', c.id === `${tab}View`)
        );
    }

    function clearQuery() {
        editor.value = '';
        resultsContainer.hidden = true;
        queryInfo.hidden = true;
    }

    function formatQuery() {
        editor.value = editor.value
            .replace(/\s+/g, ' ')
            .replace(/PREFIX/g, '\nPREFIX')
            .replace(/SELECT/g, '\n\nSELECT')
            .replace(/WHERE/g, '\nWHERE')
            .trim();
    }

    function saveQuery() {
        download(editor.value, 'sparql-query.rq', 'text/plain');
    }

    function exportCSV() {
        if (!currentResults) return;
        download(JSON.stringify(currentResults), 'results.json', 'application/json');
    }

    function download(content, filename, type) {
        const blob = new Blob([content], { type });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    /* ---------- Shortcut ---------- */

    editor.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            executeQuery();
        }
    });

});
