document.addEventListener('DOMContentLoaded', () => {

    const els = {
        uploadZone: document.getElementById('uploadZone'),
        fileInput: document.getElementById('fileInput'),
        dataInput: document.getElementById('dataInput'),
        formatSelect: document.getElementById('formatSelect'),
        uploadBtn: document.getElementById('uploadBtn'),
        clearBtn: document.getElementById('clearBtn')
    };

    /* -------- File selection -------- */

    els.uploadZone.addEventListener('click', () => {
        els.fileInput.click();
    });

    els.uploadZone.addEventListener('dragover', e => {
        e.preventDefault();
        els.uploadZone.classList.add('dragover');
    });

    els.uploadZone.addEventListener('dragleave', () => {
        els.uploadZone.classList.remove('dragover');
    });

    els.uploadZone.addEventListener('drop', e => {
        e.preventDefault();
        els.uploadZone.classList.remove('dragover');

        if (e.dataTransfer.files[0]) {
            loadFile(e.dataTransfer.files[0]);
        }
    });

    els.fileInput.addEventListener('change', e => {
        if (e.target.files[0]) {
            loadFile(e.target.files[0]);
        }
    });

    function loadFile(file) {
        const reader = new FileReader();
        reader.onload = e => {
            els.dataInput.value = e.target.result;
            showNotification(`File loaded: ${file.name}`, 'success');
        };
        reader.readAsText(file);
    }

    /* -------- Upload -------- */

    els.uploadBtn.addEventListener('click', uploadData);

    async function uploadData() {
        const data = els.dataInput.value.trim();

        if (!data) {
            showNotification('Please provide RDF data', 'warning');
            return;
        }

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data,
                    format: els.formatSelect.value
                })
            });

            const result = await res.json();

            if (result.success) {
                showNotification('Data uploaded successfully!', 'success');
                //setTimeout(() => location.href = '/browse', 1500);
            } else {
                showNotification(`Upload error: ${result.error}`, 'error');
            }

        } catch (err) {
            showNotification(`Error: ${err.message}`, 'error');
        }
    }

    /* -------- Clear -------- */

    els.clearBtn.addEventListener('click', () => {
        els.dataInput.value = '';
        els.fileInput.value = '';
    });

});
