// Load all articles
async function loadArticles() {
    const list = document.getElementById('articlesList');
    list.innerHTML = '<p>Loading articles...</p>';
    
    try {
        const language = document.getElementById('languageFilter').value;
        const topic = document.getElementById('topicFilter').value;
        
        const params = new URLSearchParams();
        if (language) params.append('language', language);
        if (topic) params.append('topic', topic);
        
        const response = await fetch(`${API_BASE}/articles?${params}`);
        const data = await response.json();
        
        // Handle both response formats
        const articles = data.articles || data;
        
        if (!articles || articles.length === 0) {
            list.innerHTML = '<p>No articles found.</p>';
            return;
        }
        
        console.log(articles);
        list.innerHTML = articles.map(article => `
            <div class="article-card" vocab="http://schema.org/" typeof="NewsArticle" data-article-id="${article.id}">
                <h3 property="headline">${article.title}</h3>
                <div class="article-meta">
                    <span property="author">${article.author}</span> | 
                    <time property="datePublished" datetime="${article.date}">
                        ${formatDate(article.date)}
                    </time> | 
                    <span property="inLanguage">${article.language.toUpperCase()}</span>
                </div>
                <p class="article-description" property="description">
                    ${article.description || 'No description available'}
                </p>
                <div class="article-actions">
                    <button class="btn btn-primary btn-view" data-id="${article.id}">View</button>
                    <button class="btn btn-secondary btn-edit" data-id="${article.id}">Edit</button>
                    <button class="btn btn-secondary btn-rdf" data-id="${article.id}">RDF</button>
                    <button class="btn btn-secondary btn-jsonld" data-id="${article.id}">JSON-LD</button>
                    <button class="btn btn-danger btn-delete" data-id="${article.id}">Delete</button>
                </div>
            </div>
        `).join('');
        
        // Attach event listeners to all buttons
        attachArticleEventListeners();
        
    } catch (error) {
        list.innerHTML = `<p class="alert alert-error">Error loading articles: ${error.message}</p>`;
    }
}

// Attach event listeners to article action buttons
function attachArticleEventListeners() {
    // View buttons
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            viewArticle(id);
        });
    });
    
    // Edit buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            editArticle(id);
        });
    });
    
    // RDF buttons
    document.querySelectorAll('.btn-rdf').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            downloadRDF(id);
        });
    });
    
    // JSON-LD buttons
    document.querySelectorAll('.btn-jsonld').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            downloadJSONLD(id);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            deleteArticle(id);
        });
    });
}

// Filter articles
function filterArticles() {
    loadArticles();
}

// View single article
async function viewArticle(id) {
    try {
        const response = await fetch(`${API_BASE}/articles/${id}`);
        const article = await response.json();
        
        // Remove existing modal if any
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>${article.title}</h2>
                <div style="color:#64748b;margin:1rem 0;">
                    ${article.author} | ${formatDate(article.date)} | ${article.language.toUpperCase()}
                </div>
                <p style="margin:1rem 0;"><strong>Description:</strong> ${article.description || 'N/A'}</p>
                <div style="margin:1rem 0;">
                    <strong>Content:</strong><br>
                    ${article.content}
                </div>
                <div style="margin:1rem 0;">
                    <strong>Word Count:</strong> ${article.wordCount || 'N/A'}<br>
                    <strong>Content Type:</strong> ${article.contentType || 'text'}<br>
                    <strong>URL:</strong> <a href="${article.url}" target="_blank">${article.url}</a>
                </div>
                <button class="btn btn-primary btn-close-modal">Close</button>
            </div>
        `;
        
        // Insert modal before footer or at end of main
        const main = document.querySelector('main');
        const footer = document.querySelector('footer');
        
        if (footer) {
            footer.parentNode.insertBefore(modal, footer);
        } else if (main) {
            main.appendChild(modal);
        } else {
            document.body.appendChild(modal);
        }
        
        // Close button event listener
        modal.querySelector('.btn-close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    } catch (error) {
        showAlert('Error loading article: ' + error.message, 'error');
    }
}

// Edit article
async function editArticle(id) {
    try {
        const response = await fetch(`${API_BASE}/articles/${id}`);
        const article = await response.json();
        
        showSection('create');
        document.getElementById('title').value = article.title;
        document.getElementById('author').value = article.author;
        document.getElementById('language').value = article.language;
        document.getElementById('contentType').value = article.contentType || 'text';
        document.getElementById('description').value = article.description || '';
        document.getElementById('content').value = article.content;
        
        const form = document.getElementById('articleForm');
        form.dataset.editId = id;
        
        showAlert('Editing article. Click "Create Article" to save changes.', 'info');
    } catch (error) {
        showAlert('Error loading article for editing: ' + error.message, 'error');
    }
}

// Delete article
async function deleteArticle(id) {
    if (!confirm('Are you sure you want to delete this article?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/articles/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('Article deleted successfully', 'success');
            loadArticles();
        } else {
            throw new Error('Failed to delete article');
        }
    } catch (error) {
        showAlert('Error deleting article: ' + error.message, 'error');
    }
}

// Download RDF
async function downloadRDF(id) {
    try {
        const response = await fetch(`${API_BASE}/articles/${id}/rdf`);
        const rdf = await response.text();
        
        const blob = new Blob([rdf], { type: 'application/rdf+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `article-${id}.rdf`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        showAlert('Error downloading RDF: ' + error.message, 'error');
    }
}

// Download JSON-LD
async function downloadJSONLD(id) {
    try {
        const response = await fetch(`${API_BASE}/articles/${id}/jsonld`);
        const jsonld = await response.json();
        
        const blob = new Blob([JSON.stringify(jsonld, null, 2)], { type: 'application/ld+json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `article-${id}.jsonld`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        showAlert('Error downloading JSON-LD: ' + error.message, 'error');
    }
}

// Search articles
async function searchArticles() {
    const query = document.getElementById('searchQuery').value;
    const resultsDiv = document.getElementById('searchResults');
    
    if (!query) {
        resultsDiv.innerHTML = '<p class="alert alert-info">Please enter a search query</p>';
        return;
    }
    
    resultsDiv.innerHTML = '<p>Searching...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/articles?topic=${encodeURIComponent(query)}`);
        const data = await response.json();
        const articles = data.articles || data;
        
        if (!articles || articles.length === 0) {
            resultsDiv.innerHTML = '<p>No articles found.</p>';
            return;
        }
        
        resultsDiv.innerHTML = `
            <h3>Found ${articles.length} articles</h3>
            <div class="articles-grid">
                ${articles.map(article => `
                    <div class="article-card">
                        <h3>${article.title}</h3>
                        <div class="article-meta">
                            ${article.author} | ${formatDate(article.date)} | ${article.language.toUpperCase()}
                        </div>
                        <p class="article-description">${article.description || 'No description'}</p>
                        <button class="btn btn-primary btn-view-search" data-id="${article.id}">View</button>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Attach event listeners to search result buttons
        resultsDiv.querySelectorAll('.btn-view-search').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                viewArticle(id);
            });
        });
        
    } catch (error) {
        resultsDiv.innerHTML = `<p class="alert alert-error">Search error: ${error.message}</p>`;
    }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    // Form submission
    const articleForm = document.getElementById('articleForm');
    if (articleForm) {
        articleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                title: document.getElementById('title').value,
                author: document.getElementById('author').value,
                language: document.getElementById('language').value,
                contentType: document.getElementById('contentType').value,
                description: document.getElementById('description').value,
                content: document.getElementById('content').value,
                topics: document.getElementById('topics').value
            };
            
            const editId = e.target.dataset.editId;
            const method = editId ? 'PUT' : 'POST';
            const url = editId ? `${API_BASE}/articles/${editId}` : `${API_BASE}/articles`;
            
            try {
                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to save article');
                }
                
                const result = await response.json();
                
                const resultDiv = document.getElementById('createResult');
                resultDiv.innerHTML = `
                    <div class="alert alert-success">
                        <h3>Article ${editId ? 'updated' : 'created'} successfully!</h3>
                        <p><strong>ID:</strong> ${result.id || result.article?.id}</p>
                        <p><strong>URL:</strong> <a href="${result.url || result.article?.url}" target="_blank">${result.url || result.article?.url}</a></p>
                        ${result.qrCode ? `<img src="${result.qrCode}" alt="QR Code" style="margin-top:1rem; max-width: 200px;">` : ''}
                    </div>
                `;
                
                e.target.reset();
                delete e.target.dataset.editId;
                
                showAlert(`Article ${editId ? 'updated' : 'created'} successfully!`, 'success');
                
            } catch (error) {
                showAlert('Error saving article: ' + error.message, 'error');
            }
        });
    }

    // Refresh button
    const refreshBtn = document.getElementById("btnRefreshArticles");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", (e) => {
            e.preventDefault();
            loadArticles();
        });
    }

    // Language filter
    const languageFilter = document.getElementById('languageFilter');
    if (languageFilter) {
        languageFilter.addEventListener('change', filterArticles);
    }

    // Topic filter (with debounce)
    const topicFilter = document.getElementById('topicFilter');
    if (topicFilter) {
        let debounceTimer;
        topicFilter.addEventListener('keyup', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(filterArticles, 500);
        });
    }

    // Search button
    const searchBtn = document.querySelector('#search button');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchArticles);
    }

    // Search on Enter key
    const searchInput = document.getElementById('searchQuery');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchArticles();
            }
        });
    }
});

// Export functions for global access
window.loadArticles = loadArticles;
window.filterArticles = filterArticles;
window.viewArticle = viewArticle;
window.editArticle = editArticle;
window.deleteArticle = deleteArticle;
window.downloadRDF = downloadRDF;
window.downloadJSONLD = downloadJSONLD;
window.searchArticles = searchArticles;