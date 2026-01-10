document.addEventListener('DOMContentLoaded', () => {

    const els = {
        searchInput: document.getElementById('searchInput'),
        searchBtn: document.getElementById('searchBtn'),
        modal: document.getElementById('detailModal'),
        modalBody: document.getElementById('modalBody')
    };

    let currentTab = 'entities';

    /* ---------------- Tabs ---------------- */

    document.querySelector('.tabs').addEventListener('click', e => {
        const btn = e.target.closest('.tab');
        if (!btn) return;

        switchTab(btn.dataset.tab);
    });

    function switchTab(tab) {
        currentTab = tab;

        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

        document.querySelector(`.tab[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(tab).classList.add('active');
    }

    /* ---------------- Loaders ---------------- */

    document.body.addEventListener('click', e => {
        const refresh = e.target.dataset.refresh;
        if (!refresh) return;

        if (refresh === 'entities') loadEntities();
        if (refresh === 'activities') loadActivities();
        if (refresh === 'agents') loadAgents();
    });

    async function loadEntities() {
        await loadList('/api/entities', 'entitiesList', 'entitiesCount', 'Entity', 'entity');
    }

    async function loadActivities() {
        await loadList('/api/activities', 'activitiesList', 'activitiesCount', 'Activity', 'activity');
    }

    async function loadAgents() {
        await loadList('/api/agents', 'agentsList', 'agentsCount', 'Agent', 'agent');
    }

    async function loadList(url, containerId, countId, label, key) {
        const container = document.getElementById(containerId);
        container.innerHTML = '<div class="loading">Loading...</div>';

        try {
            const res = await fetch(url);
            const data = await res.json();
            const items = data.results?.bindings || [];

            document.getElementById(countId).textContent = items.length;

            if (!items.length) {
                container.innerHTML = '<div class="empty-state">No results</div>';
                return;
            }

            container.innerHTML = items.map(i => `
                <div class="resource-card" data-uri="${i[key].value}">
                    <div class="resource-type type-${label.toLowerCase()}">${label}</div>
                    <div class="resource-title">
                        ${i.title?.value || i.name?.value || getShortName(i[key].value)}
                    </div>
                    <div class="resource-uri">${i[key].value}</div>
                </div>
            `).join('');

        } catch (err) {
            container.innerHTML = `<div class="error-state">${err.message}</div>`;
        }
    }

    /* ---------------- Search ---------------- */

    els.searchBtn.addEventListener('click', performSearch);
    els.searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') performSearch();
    });

    async function performSearch() {
        const term = els.searchInput.value.trim();
        if (!term) return showNotification('Enter a search term', 'warning');

        switchTab('search');

        const container = document.getElementById('searchResults');
        container.innerHTML = '<div class="loading">Searching...</div>';

        const res = await fetch('/api/search', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ searchTerm: term })
        });

        const data = await res.json();
        const results = data.results?.bindings || [];
        document.getElementById('searchCount').textContent = results.length;

        if (!results.length) {
            container.innerHTML = '<div class="empty-state">No results</div>';
            return;
        }

        container.innerHTML = results.map(r => `
            <div class="resource-card" data-uri="${r.resource.value}">
                <div class="resource-type">${getShortName(r.type.value)}</div>
                <div class="resource-title">${r.label?.value || getShortName(r.resource.value)}</div>
                <div class="resource-uri">${r.resource.value}</div>
            </div>
        `).join('');
    }

    /* ---------------- Details Modal ---------------- */

    document.body.addEventListener('click', e => {


    if (e.target.closest('[data-close]')) {
        els.modal.classList.remove('active');
        return;
    }

    const card = e.target.closest('.resource-card');
    if (card && !els.modal.contains(card)) {
        showDetails(card.dataset.uri);
    }
});

els.modal.addEventListener('click', e => {
    if (e.target === els.modal) {
        els.modal.classList.remove('active');
    }
});

    async function showDetails(uri) {
        els.modalBody.innerHTML = '<div class="loading">Loading...</div>';
        els.modal.classList.add('active');

        const res = await fetch(`/api/resource?uri=${encodeURIComponent(uri)}`);
        const data = await res.json();

        let html = `
            <h2>${getShortName(uri)}</h2>
            <p class="modal-uri">${uri}</p>
            <div class="properties-list">
        `;

        data.results?.bindings.forEach(p => {
            html += `
                <div class="property-item">
                    <div class="property-name">${getShortName(p.predicate.value)}</div>
                    <div class="property-value">${p.object.value}</div>
                </div>
            `;
        });

        els.modalBody.innerHTML = html + '</div>';
    }

    /* ---------------- Init ---------------- */

    loadEntities();
    loadActivities();
    loadAgents();

});
