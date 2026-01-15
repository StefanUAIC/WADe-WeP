<div align="center">

  <h1>WeP - Web News Provenance</h1>
  
  <p>
    A comprehensive web application for modeling and managing the provenance of online newspaper articles using W3C PROV standards, Apache Jena Fuseki, and semantic web technologies.
  </p>
  
<p>
  <a href="">
    <img src="https://img.shields.io/github/contributors/StefanUAIC/WADe-WeP" alt="contributors" />
  </a>
  <a href="">
    <img src="https://img.shields.io/github/last-commit/StefanUAIC/WADe-WeP" alt="last update" />
  </a>
  <a href="">
    <img src="https://img.shields.io/github/forks/StefanUAIC/WADe-WeP" alt="forks" />
  </a>
  <a href="">
    <img src="https://img.shields.io/github/stars/StefanUAIC/WADe-WeP" alt="stars" />
  </a>
  <a href="">
    <img src="https://img.shields.io/github/issues/StefanUAIC/WADe-WeP" alt="open issues" />
  </a>
</p>
   
<h4>
    <a href="docs/demo-video.mp4">View Demo (Link for the deployed application can be obtained Demo video)</a>
  <span> · </span>
    <a href="docs/scholarly-html/TechnicalReport.html">Technical Report</a>
  <span> · </span>
    <a href="https://github.com/StefanUAIC/WADe-WeP/issues/">Report Bug</a>
  <span> · </span>
    <a href="https://github.com/StefanUAIC/WADe-WeP/issues/">Request Feature</a>
  </h4>
</div>

<br />

# :notebook_with_decorative_cover: Table of Contents

- [About the Project](#star2-about-the-project)
  * [Tech Stack](#space_invader-tech-stack)
  * [Features](#dart-features)
  * [Environment Variables](#key-environment-variables)
- [Getting Started](#toolbox-getting-started)
  * [Prerequisites](#bangbang-prerequisites)
  * [Installation](#gear-installation)
  * [Run Locally](#running-run-locally)
  * [Deployment](#triangular_flag_on_post-deployment)
- [Usage](#eyes-usage)
- [Roadmap](#compass-roadmap)
- [License](#warning-license)
- [Contact](#handshake-contact)
- [Acknowledgements](#gem-acknowledgements)

## :star2: About the Project

WeP (Web News Provenance) is a semantic web application designed to track, model, and manage the complete provenance chain of online newspaper articles. Built using W3C PROV standards, it provides comprehensive metadata management, entity linking with DBpedia/Wikidata, and advanced recommendation systems for news content discovery.

### :space_invader: Tech Stack

<details>
  <summary>Client</summary>
  <ul>
    <li><a href="https://reactjs.org/">React.js</a></li>
    <li><a href="https://developer.mozilla.org/en-US/docs/Web/Accessibility">WCAG 2.1 AA Compliant</a></li>
    <li><a href="https://schema.org/">Schema.org</a></li>
    <li><a href="https://www.w3.org/TR/rdfa-primer/">RDFa</a></li>
  </ul>
</details>

<details>
  <summary>Server</summary>
  <ul>
    <li><a href="https://www.python.org/">Python</a></li>
    <li><a href="https://fastapi.tiangolo.com/">FastAPI</a></li>
    <li><a href="https://rdflib.readthedocs.io/">RDFLib</a></li>
    <li><a href="https://sparqlwrapper.readthedocs.io/">SPARQLWrapper</a></li>
  </ul>
</details>

<details>
<summary>Database & Semantic Web</summary>
  <ul>
    <li><a href="https://jena.apache.org/documentation/fuseki2/">Apache Jena Fuseki</a></li>
    <li><a href="https://www.w3.org/TR/sparql11-query/">SPARQL 1.1</a></li>
    <li><a href="https://www.w3.org/TR/prov-overview/">W3C PROV</a></li>
    <li><a href="https://www.w3.org/TR/shacl/">SHACL Validation</a></li>
    <li><a href="https://dbpedia.org/">DBpedia</a></li>
    <li><a href="https://www.wikidata.org/">Wikidata</a></li>
  </ul>
</details>

<details>
<summary>DevOps & ML</summary>
  <ul>
    <li><a href="https://www.docker.com/">Docker</a></li>
    <li><a href="https://aws.amazon.com/">AWS EC2</a></li>
    <li><a href="https://scikit-learn.org/">Scikit-learn</a></li>
    <li><a href="https://spacy.io/">spaCy NLP</a></li>
  </ul>
</details>

### :dart: Features

- **W3C PROV Compliance**: Full support for provenance ontology with entities, activities, and agents
- **Semantic Web Integration**: DBpedia and Wikidata entity linking and enrichment
- **SPARQL Endpoint**: Native RDF querying with comprehensive SPARQL 1.1 support
- **Schema.org Export**: JSON-LD and RDFa markup for Creative Work concepts
- **ML-Powered Recommendations**: Machine learning-based article recommendation system
- **SHACL Validation**: RDF data validation using SHACL constraints
- **Multi-format Support**: Turtle, RDF/XML, N-Triples, JSON-LD import/export
- **Accessibility Compliant**: WCAG 2.1 AA compliant user interface
- **Real-time Visualization**: Interactive provenance graph visualization
- **Multilingual Support**: Content management in multiple languages

### :key: Environment Variables

To run this project, you will need to add the following environment variables to your .env file

```env
FUSEKI_URL=http://localhost:3030
REACT_APP_API_URL=http://localhost:8000
DBPEDIA_ENDPOINT=http://dbpedia.org/sparql
WIKIDATA_ENDPOINT=https://query.wikidata.org/sparql
```

## :toolbox: Getting Started

### :bangbang: Prerequisites

This project requires Docker and Docker Compose

```bash
# Install Docker Desktop
# https://docs.docker.com/desktop/

# Verify installation
docker --version
docker-compose --version
```

### :gear: Installation

Clone the project

```bash
git clone https://github.com/StefanUAIC/WADe-WeP.git
cd WADe-WeP
```

### :running: Run Locally

Start all services with Docker Compose

```bash
docker-compose up --build
```

Access the application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Fuseki SPARQL**: http://localhost:3030

### :triangular_flag_on_post: Deployment

**Live Demo:** Available during evaluation period (January 13-15, 2026)

Deploy to AWS EC2

```bash
# On EC2 instance
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2
sudo systemctl start docker

# Transfer files
scp -i wep-key.pem wep-deploy.tar.gz ubuntu@your-ec2-ip:~/
ssh -i wep-key.pem ubuntu@your-ec2-ip
tar xzf wep-deploy.tar.gz
sudo docker compose up -d --build

# Create dataset in Fuseki UI
# Access http://your-ec2-ip:3030
# Create dataset: news-provenance (Persistent TDB2)
```

Access the application:
- **Frontend**: http://your-ec2-ip:3000
- **Backend API**: http://your-ec2-ip:8000/docs
- **Fuseki SPARQL**: http://your-ec2-ip:3030

## :eyes: Usage

### Creating Articles with Provenance

```python
# Example API usage
import requests

article_data = {
    "title": "Breaking News: AI Advances",
    "content": "Article content here...",
    "author": "Jane Smith",
    "publication": "Tech Daily",
    "language": "en",
    "keywords": ["AI", "technology", "innovation"]
}

response = requests.post("http://localhost:8000/api/articles", json=article_data)
```

### SPARQL Queries

```sparql
# Find all articles and their provenance
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX schema: <http://schema.org/>

SELECT ?article ?title ?author ?activity
WHERE {
  ?article a schema:NewsArticle ;
           schema:headline ?title ;
           schema:author ?author ;
           prov:wasGeneratedBy ?activity .
}
```

## :compass: Roadmap

* [x] W3C PROV implementation
* [x] SPARQL endpoint setup
* [x] DBpedia/Wikidata integration
* [x] SHACL validation
* [x] ML recommendation system
* [ ] Advanced NLP entity extraction
* [ ] Blockchain provenance verification
* [ ] Real-time collaboration features

## :warning: License

Distributed under the MIT License. See LICENSE.txt for more information.

## :handshake: Contact

Stefan Catiru - [@StefanUAIC](https://github.com/StefanUAIC)

Matei Maxim - [@HowDidThat](https://github.com/HowDidThat)

Project Link: [https://github.com/StefanUAIC/WADe-WeP](https://github.com/StefanUAIC/WADe-WeP)

## :gem: Acknowledgements

- [W3C PROV Working Group](https://www.w3.org/TR/prov-overview/)
- [Apache Jena Community](https://jena.apache.org/)
- [DBpedia Association](https://www.dbpedia.org/)
- [Wikidata Community](https://www.wikidata.org/)
- [Schema.org Community](https://schema.org/)
- [SHACL W3C Recommendation](https://www.w3.org/TR/shacl/)
- [FastAPI Framework](https://fastapi.tiangolo.com/)
- [React Community](https://reactjs.org/)
