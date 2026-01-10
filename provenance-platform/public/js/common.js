// Common JavaScript utilities for Provenance Platform

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification show ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Get short name from URI
function getShortName(uri) {
    if (!uri) return '';
    return uri.split(/[#/]/).pop();
}

// Format date
function formatDate(dateStr) {
    try {
        return new Date(dateStr).toLocaleString();
    } catch {
        return dateStr;
    }
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copied to clipboard', 'success');
    }).catch(err => {
        showNotification('Failed to copy', 'error');
    });
}

// Export data to CSV
function exportToCSV(data, filename) {
    const csv = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Format SPARQL query
function formatSparqlQuery(query) {
    let formatted = query.replace(/\s+/g, ' ').trim();
    formatted = formatted.replace(/PREFIX/g, '\nPREFIX');
    formatted = formatted.replace(/SELECT/g, '\n\nSELECT');
    formatted = formatted.replace(/WHERE/g, '\nWHERE');
    formatted = formatted.replace(/\{/g, '{\n  ');
    formatted = formatted.replace(/\}/g, '\n}');
    formatted = formatted.replace(/\./g, ' .\n  ');
    formatted = formatted.replace(/OPTIONAL/g, '\n  OPTIONAL');
    formatted = formatted.replace(/FILTER/g, '\n  FILTER');
    formatted = formatted.replace(/UNION/g, '\n} UNION {\n  ');
    return formatted.trim();
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Parse SPARQL results to simple array
function parseSparqlResults(data) {
    if (!data || !data.results || !data.results.bindings) {
        return [];
    }
    
    return data.results.bindings.map(binding => {
        const row = {};
        for (const key in binding) {
            row[key] = binding[key].value;
        }
        return row;
    });
}

// Check if Fuseki is connected
async function checkFusekiHealth() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        return data.status === 'ok';
    } catch {
        return false;
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Validate RDF/Turtle data (basic check)
function validateTurtleData(data) {
    const lines = data.split('\n').filter(line => line.trim());
    
    // Check for common prefixes
    const hasPrefixes = lines.some(line => line.trim().startsWith('@prefix'));
    
    // Check for triples (basic pattern)
    const hasTriples = lines.some(line => {
        const trimmed = line.trim();
        return !trimmed.startsWith('@') && 
               !trimmed.startsWith('#') &&
               trimmed.length > 0;
    });
    
    return hasPrefixes && hasTriples;
}

// Get type color for visualization
function getTypeColor(type) {
    const typeMap = {
        'Entity': '#64b5f6',
        'Activity': '#ffb74d',
        'Agent': '#ba68c8',
        'Person': '#9575cd',
        'Organization': '#7986cb'
    };
    
    const shortType = getShortName(type);
    return typeMap[shortType] || '#90a4ae';
}

// Format SPARQL error message
function formatSparqlError(error) {
    if (typeof error === 'string') {
        return error;
    }
    if (error.message) {
        return error.message;
    }
    return 'Unknown SPARQL error';
}

// Create download link
function createDownloadLink(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Parse URI to get namespace and local name
function parseUri(uri) {
    const match = uri.match(/^(.+[#/])([^#/]+)$/);
    if (match) {
        return {
            namespace: match[1],
            localName: match[2]
        };
    }
    return {
        namespace: uri,
        localName: ''
    };
}

// Common SPARQL prefixes
const COMMON_PREFIXES = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
`;

// Get common prefixes object
function getCommonPrefixes() {
    return {
        'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
        'prov': 'http://www.w3.org/ns/prov#',
        'dcterms': 'http://purl.org/dc/terms/',
        'foaf': 'http://xmlns.com/foaf/0.1/',
        'xsd': 'http://www.w3.org/2001/XMLSchema#'
    };
}

// Shorten URI with prefix
function shortenUri(uri, prefixes = getCommonPrefixes()) {
    for (const [prefix, namespace] of Object.entries(prefixes)) {
        if (uri.startsWith(namespace)) {
            return `${prefix}:${uri.substring(namespace.length)}`;
        }
    }
    return uri;
}

// Check if string is a valid URI
function isValidUri(str) {
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// Initialize tooltips (if needed)
function initTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(element => {
        element.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = e.target.dataset.tooltip;
            document.body.appendChild(tooltip);
            
            const rect = e.target.getBoundingClientRect();
            tooltip.style.position = 'absolute';
            tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;
            tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
            
            e.target._tooltip = tooltip;
        });
        
        element.addEventListener('mouseleave', (e) => {
            if (e.target._tooltip) {
                e.target._tooltip.remove();
                delete e.target._tooltip;
            }
        });
    });
}

// Call on page load
document.addEventListener('DOMContentLoaded', () => {
    initTooltips();
});