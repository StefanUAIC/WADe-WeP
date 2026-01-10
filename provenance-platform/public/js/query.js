document.addEventListener('DOMContentLoaded', () => {

    /* ---------------- Elements ---------------- */

    const els = {
        resourceType: document.getElementById('resourceType'),
        title: document.getElementById('titleFilter'),
        uri: document.getElementById('uriFilter'),
        generatedBy: document.getElementById('generatedByFilter'),
        attributedTo: document.getElementById('attributedToFilter'),
        derivedFrom: document.getElementById('derivedFromFilter'),
        startAfter: document.getElementById('startAfter'),
        endBefore: document.getElementById('endBefore'),

        resultsGrid: document.getElementById('resultsGrid'),
        resultsSummary: document.getElementById('resultsSummary'),
        resultCount: document.getElementById('resultCount'),

        sparqlModal: document.getElementById('sparqlModal'),
        sparqlTextarea: document.getElementById('generatedSparql'),

        searchBtn: document.getElementById('searchBtn'),
        clearBtn: document.getElementById('clearBtn'),
        viewSparqlBtn: document.getElementById('viewSparqlBtn')
    };

    let currentResults = null;

    /* ---------------- Helpers ---------------- */

    function escapeSparql(str) {
        return str.replace(/["\\]/g, '\\$&');
    }

    function getShortName(uri) {
        return uri.split(/[#/]/).pop();
    }

    /* ---------------- SPARQL Builder ---------------- */

    function buildSparqlQuery() {
        const where = [];
        const filters = [];

        where.push('?resource rdf:type ?type .');
        where.push('FILTER(?type IN (prov:Entity, prov:Activity, prov:Agent))');
        where.push('OPTIONAL { ?resource dcterms:title ?label }');

        /* ---- Type filter ---- */
        if (els.resourceType.value) {
            filters.push(`?type = prov:${els.resourceType.value}`);
        }

        /* ---- Title contains ---- */
        if (els.title.value.trim()) {
            filters.push(`
                CONTAINS(
                    LCASE(STR(?label)),
                    LCASE("${escapeSparql(els.title.value)}")
                )
            `);
        }

        /* ---- URI contains ---- */
        if (els.uri.value.trim()) {
            filters.push(`
                CONTAINS(
                    STR(?resource),
                    "${escapeSparql(els.uri.value)}"
                )
            `);
        }

        /* ---- PROV relations ---- */
        if (els.generatedBy.value.trim()) {
            where.push(`
                ?resource prov:wasGeneratedBy <${els.generatedBy.value.trim()}>;
            `);
        }

        if (els.attributedTo.value.trim()) {
            where.push(`
                ?resource prov:wasAttributedTo <${els.attributedTo.value.trim()}>;
            `);
        }

        if (els.derivedFrom.value.trim()) {
            where.push(`
                ?resource prov:wasDerivedFrom <${els.derivedFrom.value.trim()}>;
            `);
        }

        /* ---- Time filters (activities) ---- */
        if (els.startAfter.value) {
            where.push(`
                ?resource prov:startedAtTime ?startTime .
                FILTER (?startTime >= "${els.startAfter.value}"^^xsd:dateTime)
            `);
        }

        if (els.endBefore.value) {
            where.push(`
                ?resource prov:endedAtTime ?endTime .
                FILTER (?endTime <= "${els.endBefore.value}"^^xsd:dateTime)
            `);
        }

        const filterBlock = filters.length
            ? `FILTER(${filters.join(' && ')})`
            : '';

        return COMMON_PREFIXES + `
SELECT DISTINCT ?resource ?type ?label WHERE {
  ${where.join('\n')}
  ${filterBlock}
}
LIMIT 100
`;
    }

    /* ---------------- Execute Query ---------------- */

    async function executeQuery() {
        els.resultsGrid.innerHTML = '<div class="loading">Searching…</div>';
        els.resultsSummary.classList.remove('show');

        const query = buildSparqlQuery();

        try {
            const res = await fetch('/api/sparql/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            const data = await res.json();
            currentResults = data;
            renderResults(data.results?.bindings || []);

        } catch (err) {
            els.resultsGrid.innerHTML =
                `<div class="error-state">${err.message}</div>`;
        }
    }

    /* ---------------- Render Results ---------------- */

    function renderResults(bindings) {
        if (!bindings.length) {
            els.resultsGrid.innerHTML =
                '<div class="empty-state">No results</div>';
            els.resultsSummary.classList.remove('show');
            return;
        }

        els.resultCount.textContent = `${bindings.length} results`;
        els.resultsSummary.classList.add('show');

        els.resultsGrid.innerHTML = bindings.map(b => `
            <div class="resource-card">
                <div class="resource-title">
                    ${b.label?.value || getShortName(b.resource.value)}
                </div>
                <div class="resource-uri">${b.resource.value}</div>
                <div class="resource-meta">
                    ${getShortName(b.type.value)}
                </div>
            </div>
        `).join('');
    }

    /* ---------------- Clear ---------------- */

    function clearFilters() {
        document.querySelectorAll('.filter-input').forEach(i => i.value = '');
        els.resultsGrid.innerHTML =
            '<div class="empty-state">Filters cleared</div>';
        els.resultsSummary.classList.remove('show');
    }

    /* ---------------- Events ---------------- */

    els.searchBtn.addEventListener('click', executeQuery);
    els.clearBtn.addEventListener('click', clearFilters);

    els.viewSparqlBtn.addEventListener('click', () => {
        els.sparqlTextarea.value = buildSparqlQuery();
        els.sparqlModal.classList.add('active');
    });

    document.querySelectorAll('.quick-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            clearFilters();

            if (btn.dataset.filter === 'recentEntities') {
                els.resourceType.value = 'Entity';
            }

            executeQuery();
        });
    });

    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('active');
        });
    });

});
