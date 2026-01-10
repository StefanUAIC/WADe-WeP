module.exports = {
  FUSEKI_URL: process.env.FUSEKI_URL || 'http://localhost:3030',
  DATASET_NAME: 'news-provenance',
  
  get SPARQL_ENDPOINT() {
    return `${this.FUSEKI_URL}/${this.DATASET_NAME}/sparql`;
  },
  
  get UPDATE_ENDPOINT() {
    return `${this.FUSEKI_URL}/${this.DATASET_NAME}/update`;
  },
  
  get DATA_ENDPOINT() {
    return `${this.FUSEKI_URL}/${this.DATASET_NAME}/data`;
  }
};