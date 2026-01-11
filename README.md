# Provenance Management Platform

A comprehensive web application for modeling and managing the provenance of online newspaper articles using W3C PROV standards, Apache Jena Fuseki, and semantic web technologies.

## 📁 Complete Folder Structure

test commit

```
provenance-platform/
├── server.js                 # Node.js Express server with Fuseki integration
├── package.json              # Project dependencies
├── README.md                 # This file
├── .env.example             # Environment variables template
└── public/                  # Frontend files
    ├── index.html           # Home page with statistics
    ├── browse.html          # Browse entities/activities/agents
    ├── query.html           # Query builder interface
    ├── sparql.html          # SPARQL editor
    ├── upload.html          # Data upload interface
    ├── visualize.html       # Graph visualization
    ├── css/
    │   └── style.css        # Common styles
    └── js/
        └── common.js        # Common JavaScript utilities
```

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v14 or higher)
2. **Apache Jena Fuseki** server running with a dataset named `news-provenance`

### Install Apache Jena Fuseki

```bash
# Download Fuseki
wget https://dlcdn.apache.org/jena/binaries/apache-jena-fuseki-4.10.0.tar.gz

# Extract
tar xzf apache-jena-fuseki-4.10.0.tar.gz
cd apache-jena-fuseki-4.10.0

# Start Fuseki server
./fuseki-server --mem /news-provenance

# Or with persistent storage
./fuseki-server --loc=./databases/news-provenance /news-provenance
```

Fuseki will start on `http://localhost:3030` with a web UI at that address.

### Install the Application

```bash
# 1. Create project directory
mkdir provenance-platform
cd provenance-platform

# 2. Create folder structure
mkdir -p public/css public/js

# 3. Save all provided files to their respective locations:
#    - server.js in root
#    - package.json in root
#    - All HTML files in public/
#    - style.css in public/css/
#    - common.js in public/js/

# 4. Install dependencies
npm install

# 5. (Optional) Create .env file for custom configuration
cat > .env << EOF
PORT=3000
FUSEKI_URL=http://localhost:3030
EOF

# 6. Start the server
npm start
```

## 🎯 Application Pages

### 1. **Home Page** (`/`)
- Database statistics dashboard
- Connection status to Fuseki
- Quick action links
- Feature overview

### 2. **Browse Page** (`/browse`)
- Tabbed interface for Entities, Activities, and Agents
- Search functionality across all resources
- Click any card to view detailed properties
- Real-time data from Fuseki

### 3. **Query Builder** (`/query`)
- User-friendly query interface
- Filter by resource type, title, URI
- Provenance relationship filters
- Time range filters for activities
- Quick filter presets
- Export results to CSV/JSON
- View generated SPARQL queries

### 4. **SPARQL Editor** (`/sparql`)
- Full-featured SPARQL query editor
- 6+ example queries included
- Syntax highlighting
- Query formatting
- Results in table and JSON views
- Export to CSV
- Keyboard shortcuts (Ctrl+Enter to execute)

### 5. **Upload Page** (`/upload`)
- Drag-and-drop file upload
- Manual RDF data entry
- Multiple format support (Turtle, RDF/XML, N-Triples, N3)
- Data validation
- Direct upload to Fuseki

### 6. **Visualization Page** (`/visualize`)
- Interactive force-directed graph
- D3.js powered visualization
- Color-coded node types
- Zoom and pan controls
- Draggable nodes
- Click nodes to navigate to details

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
FUSEKI_URL=http://localhost:3030
```

### Fuseki Configuration

The application expects:
- **Endpoint**: `http://localhost:3030`
- **Dataset Name**: `news-provenance`
- **SPARQL Query Endpoint**: `http://localhost:3030/news-provenance/sparql`
- **SPARQL Update Endpoint**: `http://localhost:3030/news-provenance/update`
- **Data Upload Endpoint**: `http://localhost:3030/news-provenance/data`

## 📊 API Endpoints

### Query Endpoints

- `GET /api/entities` - Get all entities
- `GET /api/activities` - Get all activities
- `GET /api/agents` - Get all agents
- `GET /api/provenance-graph` - Get graph data for visualization
- `GET /api/resource?uri=<URI>` - Get resource details
- `GET /api/recommend?uri=<URI>` - Get related resources
- `GET /api/stats` - Get database statistics

### Data Management

- `POST /api/upload` - Upload RDF data to Fuseki
- `POST /api/sparql/query` - Execute SPARQL SELECT query
- `POST /api/sparql/update` - Execute SPARQL UPDATE
- `POST /api/search` - Full-text search

### Health

- `GET /api/health` - Check Fuseki connection status

## 🎨 Features

### Core Capabilities

✅ **W3C PROV Compliant**
- Full support for PROV-O ontology
- Entities, Activities, and Agents
- All standard provenance relationships

✅ **Apache Jena Fuseki Integration**
- Direct SPARQL queries to Fuseki
- Real-time data updates
- Efficient triple store backend

✅ **Rich Metadata Support**
- Dublin Core (DCMI)
- FOAF (Friend of a Friend)
- IPTC Standards
- Custom vocabularies

✅ **Multiple Interfaces**
- Simple query builder for non-technical users
- Advanced SPARQL editor for power users
- Interactive graph visualization
- Browsable resource catalog

✅ **Data Upload**
- Multiple RDF formats
- Drag-and-drop interface
- Validation before upload
- Batch processing capability

### User Experience

- 🎨 Modern, gradient-based UI design
- 📱 Responsive layout
- 🔔 Real-time notifications
- ⌨️ Keyboard shortcuts
- 💾 Export functionality (CSV, JSON)
- 🔍 Full-text search
- 🌐 Interactive graph visualization

## 📝 Example Data

### Sample Turtle Data

```turtle
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix ex: <http://example.org/news#> .

# Article Entity
ex:article_001 a prov:Entity ;
    dcterms:title "Breaking News: Technology Advances" ;
    dcterms:creator ex:reporter_jane ;
    dcterms:created "2024-01-15T10:00:00"^^xsd:dateTime ;
    prov:wasGeneratedBy ex:writing_activity ;
    prov:wasAttributedTo ex:reporter_jane .

# Writing Activity
ex:writing_activity a prov:Activity ;
    prov:used ex:source_data ;
    prov:startedAtTime "2024-01-15T08:00:00"^^xsd:dateTime ;
    prov:endedAtTime "2024-01-15T10:00:00"^^xsd:dateTime ;
    prov:wasAssociatedWith ex:reporter_jane .

# Reporter Agent
ex:reporter_jane a prov:Agent, prov:Person ;
    foaf:name "Jane Smith" ;
    foaf:mbox <mailto:jane@newspaper.com> ;
    prov:actedOnBehalfOf ex:newspaper_org .

# Newspaper Organization
ex:newspaper_org a prov:Agent, prov:Organization ;
    foaf:name "Daily News Corporation" .

# Revised Article
ex:article_002 a prov:Entity ;
    dcterms:title "Breaking News: Technology Advances (Updated)" ;
    prov:wasRevisionOf ex:article_001 ;
    prov:wasGeneratedBy ex:revision_activity .
```

## 🔍 Example SPARQL Queries

### Find All Articles and Their Authors

```sparql
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>

SELECT ?article ?title ?author ?authorName
WHERE {
  ?article a prov:Entity ;
           dcterms:title ?title ;
           prov:wasAttributedTo ?author .
  ?author foaf:name ?authorName .
}
```

### Find Provenance Chain

```sparql
PREFIX prov: <http://www.w3.org/ns/prov#>

SELECT ?entity ?activity ?agent
WHERE {
  ?entity prov:wasGeneratedBy ?activity .
  ?activity prov:wasAssociatedWith ?agent .
}
```

### Find Derived Articles

```sparql
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX dcterms: <http://purl.org/dc/terms/>

SELECT ?original ?originalTitle ?derived ?derivedTitle
WHERE {
  ?derived prov:wasDerivedFrom ?original .
  OPTIONAL { ?original dcterms:title ?originalTitle }
  OPTIONAL { ?derived dcterms:title ?derivedTitle }
}
```

## 🛠️ Development

### Run in Development Mode

```bash
npm run dev
```

This uses nodemon for auto-restart on file changes.

### Project Architecture

**Backend (server.js)**
- Express.js web server
- Axios for Fuseki communication
- RESTful API endpoints
- SPARQL query translation
- File upload handling

**Frontend**
- Vanilla JavaScript (no framework dependencies)
- D3.js for graph visualization
- Responsive CSS with gradient design
- Modular page structure
- Common utilities in `common.js`

## 📖 W3C PROV Standards

### Core Classes

- **`prov:Entity`** - Physical, digital, or conceptual things
- **`prov:Activity`** - Actions that occur over time
- **`prov:Agent`** - Responsible parties (people, organizations)

### Key Properties

- **Generation**: `prov:wasGeneratedBy`
- **Usage**: `prov:used`
- **Attribution**: `prov:wasAttributedTo`
- **Association**: `prov:wasAssociatedWith`
- **Derivation**: `prov:wasDerivedFrom`
- **Revision**: `prov:wasRevisionOf`
- **Delegation**: `prov:actedOnBehalfOf`

## 🔒 Security Considerations

For production deployment:

1. **Authentication**: Add user authentication (e.g., JWT, OAuth)
2. **Authorization**: Implement role-based access control
3. **CORS**: Configure CORS for API endpoints
4. **Rate Limiting**: Add rate limiting to prevent abuse
5. **Input Validation**: Sanitize all user inputs
6. **HTTPS**: Use HTTPS in production
7. **Fuseki Security**: Enable Fuseki authentication

## 🚀 Production Deployment

### Using PM2

```bash
npm install -g pm2
pm2 start server.js --name provenance-platform
pm2 save
pm2 startup
```

### Using Docker

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name provenance.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🐛 Troubleshooting

### Fuseki Not Connected

- Verify Fuseki is running: `curl http://localhost:3030/$/ping`
- Check the dataset exists: Visit `http://localhost:3030`
- Verify FUSEKI_URL in environment variables

### No Data Showing

- Upload sample data via the Upload page
- Check Fuseki logs for errors
- Verify SPARQL endpoint is accessible

### Graph Not Rendering

- Check browser console for JavaScript errors
- Ensure D3.js is loaded from CDN
- Verify data contains PROV relationships

## 📚 Resources

- [W3C PROV Overview](https://www.w3.org/TR/prov-overview/)
- [Apache Jena Fuseki](https://jena.apache.org/documentation/fuseki2/)
- [SPARQL 1.1 Query Language](https://www.w3.org/TR/sparql11-query/)
- [Dublin Core Metadata Initiative](https://www.dublincore.org/)
- [FOAF Vocabulary](http://xmlns.com/foaf/spec/)

## 📄 License

MIT License - feel free to use and modify for your needs.

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Support

For issues or questions, please open an issue on the project repository.