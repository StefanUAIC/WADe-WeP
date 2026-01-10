# News Provenance Platform

A semantic web application for managing and querying newspaper article provenance using RDF, SPARQL, and linked data principles.

## 🎯 Project Overview

This platform enables comprehensive management of online newspaper articles with rich metadata, provenance tracking, and semantic querying capabilities. Built with Node.js, Apache Jena Fuseki, and modern web technologies.

## ✨ Features

- **Article Management**: Create, read, update, and delete newspaper articles with rich metadata
- **RDF Support**: Full RDF/XML, JSON-LD, and RDFa representation of articles
- **SPARQL Endpoint**: Query articles using SPARQL with predefined and custom queries
- **Metadata Standards**: DCMI, IPTC, and Schema.org compliance
- **Linked Data**: Integration with DBpedia and Wikidata
- **Multi-language**: Support for English, Romanian, Spanish, French, and German
- **Content Types**: Text, multimedia, audio, and video articles
- **QR Codes**: Generated for each article URL
- **Export Capabilities**: Download articles in various RDF formats

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **Apache Jena Fuseki** (SPARQL endpoint and triple store)
- **RDFLib** for RDF generation
- **Axios** for HTTP requests

### Frontend
- **HTML5** with RDFa annotations
- **CSS3** (responsive design)
- **Vanilla JavaScript** (ES6+)

### Data Standards
- **Schema.org** (Creative Work vocabulary)
- **Dublin Core Metadata Initiative (DCMI)**
- **IPTC Standards**
- **Social Semantic Web Thesaurus**

## 📋 Prerequisites

- Node.js 18+ and npm
- Apache Jena Fuseki 4.x
- Git

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/news-provenance-platform.git
cd news-provenance-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:
```
PORT=3000
FUSEKI_URL=http://localhost:3030
FUSEKI_DATASET=news-provenance
```

### 4. Setup Apache Jena Fuseki

Download and install Apache Jena Fuseki from [Apache Jena website](https://jena.apache.org/download/).

Start Fuseki:
```bash
cd apache-jena-fuseki-x.x.x
./fuseki-server --port=3030
```

Create a dataset named `news-provenance` via the Fuseki web interface at `http://localhost:3030`.

### 5. Start the Application

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 📁 Project Structure

```
news-provenance-platform/
├── backend/
│   ├── server.js                 # Main server file
│   ├── routes/
│   │   ├── articles.js          # Article CRUD routes
│   │   ├── sparql.js            # SPARQL endpoint routes
│   │   └── metadata.js          # Metadata & external API routes
│   └── services/
│       ├── rdf.service.js       # RDF generation service
│       └── fuseki.service.js    # Fuseki integration service
├── frontend/
│   ├── index.html               # Main HTML page
│   ├── css/
│   │   └── styles.css           # Application styles
│   └── js/
│       ├── main.js              # Core JavaScript
│       ├── article-manager.js   # Article management
│       └── sparql-query.js      # SPARQL interface
├── docs/
│   ├── architecture.md          # Architecture documentation
│   ├── openapi.yaml            # API specification
│   └── technical-report.html   # Technical report
├── package.json
├── .env.example
└── README.md
```

## 🔌 API Endpoints

### Articles

- `GET /api/articles` - Get all articles (with optional filters)
- `GET /api/articles/:id` - Get single article
- `POST /api/articles` - Create new article
- `PUT /api/articles/:id` - Update article
- `DELETE /api/articles/:id` - Delete article
- `GET /api/articles/:id/rdf` - Get article RDF/XML
- `GET /api/articles/:id/jsonld` - Get article JSON-LD
- `GET /api/articles/:id/metadata` - Get article metadata

### SPARQL

- `POST /api/sparql/query` - Execute SPARQL query
- `GET /api/sparql/queries` - Get predefined queries
- `POST /api/sparql/queries/:queryName` - Execute predefined query

### Metadata

- `GET /api/metadata/enrich/dbpedia/:topic` - Enrich from DBpedia
- `GET /api/metadata/enrich/wikidata/:topic` - Enrich from Wikidata
- `GET /api/metadata/templates/dc` - Get Dublin Core template
- `GET /api/metadata/templates/iptc` - Get IPTC template

## 📊 SPARQL Query Examples

### Fresh Editorials
```sparql
PREFIX schema: <http://schema.org/>

SELECT ?title ?author ?date
WHERE {
  ?article a schema:NewsArticle ;
           schema:headline ?title ;
           schema:author ?author ;
           schema:datePublished ?date .
  FILTER(?date > "2024-01-01T00:00:00"^^xsd:dateTime)
}
ORDER BY DESC(?date)
```

### Articles by Language
```sparql
PREFIX schema: <http://schema.org/>

SELECT ?title ?language ?wordCount
WHERE {
  ?article a schema:NewsArticle ;
           schema:headline ?title ;
           schema:inLanguage ?language ;
           schema:wordCount ?wordCount .
  FILTER(?language = "en" || ?language = "es")
  FILTER(?wordCount < 4000)
}
```

## 🌐 Linked Data Integration

The platform integrates with external knowledge bases:

- **DBpedia**: Entity enrichment and linking
- **Wikidata**: Semantic information and relationships

Articles follow linked data principles:
- Each article has a unique URI
- RDF representation available in multiple formats
- Links to external vocabularies and datasets

## 📖 Documentation

Full documentation available in the `/docs` directory:

- **Architecture Documentation**: System design and components
- **OpenAPI Specification**: Complete API documentation
- **Technical Report**: Detailed implementation guide
- **User Guide**: How to use the platform

## 🧪 Testing

Run tests:
```bash
npm test
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👥 Team

- Team Member 1 - Backend development, RDF implementation
- Team Member 2 - Frontend development, SPARQL queries

## 📧 Contact

For questions or support, please open an issue on GitHub.

## 🙏 Acknowledgments

- Apache Jena Project
- Schema.org
- Dublin Core Metadata Initiative
- IPTC Standards
- WADe Course - Faculty of Computer Science, UAIC

## 🔗 Useful Links

- [Apache Jena Documentation](https://jena.apache.org/documentation/)
- [Schema.org](https://schema.org/)
- [SPARQL 1.1 Query Language](https://www.w3.org/TR/sparql11-query/)
- [Dublin Core Metadata](https://www.dublincore.org/)
- [Linked Data Principles](https://www.w3.org/DesignIssues/LinkedData.html)