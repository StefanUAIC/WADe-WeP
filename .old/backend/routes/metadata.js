class RDFService {
  constructor() {
    this.baseUri = 'http://news-provenance.org';
  }

  escapeString(str) {
    return str.replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r');
  }

  createArticleRDF(article) {
    const articleUri = `<${this.baseUri}/article/${article.id}>`;
    const authorUri = `<${this.baseUri}/author/${encodeURIComponent(article.author)}>`;
    
    const wordCount = article.wordCount || (article.content ? article.content.split(/\s+/).length : 0);
    
    return `
      @prefix schema: <http://schema.org/> .
      @prefix dc: <http://purl.org/dc/elements/1.1/> .
      @prefix dcterms: <http://purl.org/dc/terms/> .
      @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
      
      ${articleUri} a schema:NewsArticle, schema:CreativeWork ;
        schema:headline "${this.escapeString(article.title)}" ;
        schema:articleBody "${this.escapeString(article.content)}" ;
        schema:author ${authorUri} ;
        schema:datePublished "${article.createdAt || new Date().toISOString()}"^^xsd:dateTime ;
        schema:inLanguage "${article.language}" ;
        schema:description "${this.escapeString(article.description || article.title)}" ;
        schema:url <${article.url || this.baseUri + '/articles/' + article.id}> ;
        schema:wordCount "${wordCount}"^^xsd:integer ;
        schema:encodingFormat "${article.contentType || 'text'}" ;
        dc:creator "${this.escapeString(article.author)}" ;
        dcterms:created "${article.createdAt || new Date().toISOString()}"^^xsd:dateTime ;
        dcterms:modified "${article.updatedAt || article.createdAt || new Date().toISOString()}"^^xsd:dateTime ;
        dcterms:rights "${article.license || 'CC BY 4.0'}" ;
        dcterms:provenance "${this.escapeString(article.source || 'Original')}" .
      
      ${authorUri} a schema:Person ;
        schema:name "${this.escapeString(article.author)}" .
    `;
  }

  createArticleJSONLD(article) {
    const wordCount = article.wordCount || (article.content ? article.content.split(/\s+/).length : 0);
    
    return {
      "@context": "http://schema.org",
      "@type": "NewsArticle",
      "@id": `${this.baseUri}/article/${article.id}`,
      "headline": article.title,
      "articleBody": article.content,
      "author": {
        "@type": "Person",
        "@id": `${this.baseUri}/author/${encodeURIComponent(article.author)}`,
        "name": article.author
      },
      "datePublished": article.createdAt || new Date().toISOString(),
      "dateModified": article.updatedAt || article.createdAt || new Date().toISOString(),
      "inLanguage": article.language,
      "description": article.description || article.title,
      "url": article.url || `${this.baseUri}/articles/${article.id}`,
      "wordCount": wordCount,
      "encodingFormat": article.contentType || 'text',
      "license": article.license || "https://creativecommons.org/licenses/by/4.0/",
      "copyrightHolder": {
        "@type": "Person",
        "name": article.author
      },
      "publisher": {
        "@type": "Organization",
        "name": "News Provenance Platform",
        "url": this.baseUri
      }
    };
  }

  createArticleRDFa(article) {
    const wordCount = article.wordCount || (article.content ? article.content.split(/\s+/).length : 0);
    
    return `
<!DOCTYPE html>
<html lang="${article.language}">
<head>
  <meta charset="UTF-8">
  <title>${article.title}</title>
</head>
<body vocab="http://schema.org/" typeof="NewsArticle" resource="${this.baseUri}/article/${article.id}">
  <article>
    <h1 property="headline">${article.title}</h1>
    
    <div class="metadata">
      <span property="author" typeof="Person">
        <span property="name">${article.author}</span>
      </span>
      
      <time property="datePublished" datetime="${article.createdAt || new Date().toISOString()}">
        ${new Date(article.createdAt || Date.now()).toLocaleDateString()}
      </time>
      
      <meta property="inLanguage" content="${article.language}">
      <meta property="wordCount" content="${wordCount}">
    </div>
    
    <div property="description">${article.description || article.title}</div>
    
    <div property="articleBody">
      ${article.content}
    </div>
    
    <link property="url" href="${article.url || this.baseUri + '/articles/' + article.id}">
    <meta property="encodingFormat" content="${article.contentType || 'text'}">
  </article>
</body>
</html>
    `;
  }
}

module.exports = RDFService;