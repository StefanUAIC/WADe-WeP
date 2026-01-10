(() => {
    document.addEventListener('DOMContentLoaded', () => {
        checkConnection();
        loadStats();
        setInterval(loadStats, 30000);
    });

    async function checkConnection() {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        const statusDetails = document.getElementById('statusDetails');

        try {
            const res = await fetch('/api/health');
            const data = await res.json();

            if (data.status === 'ok') {
                statusDot.className = 'status-indicator status-ok';
                statusText.textContent = 'Connected';
                statusDetails.textContent = `${data.endpoint} / ${data.dataset}`;
            } else {
                throw new Error(data.error);
            }
        } catch {
            statusDot.className = 'status-indicator status-error';
            statusText.textContent = 'Disconnected';
            statusDetails.textContent = '';
        }
    }

    async function loadStats() {
        try {
            const res = await fetch('/api/stats');
            const data = await res.json();
            
            const stats = data?.results?.bindings?.[0];
            if (!stats) return;

            setText('statEntities', stats.entities?.value);
            setText('statActivities', stats.activities?.value);
            setText('statAgents', stats.agents?.value);
        } catch (e) {
            console.error('Stats load failed', e);
        }
    }

    function setText(id, value = '0') {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }
})();
