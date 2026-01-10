const axios = require('axios');
const config = require('../config/fuseki');

class FusekiService {
  async executeSparql(query) {
    try {
      const response = await axios.post(
        config.SPARQL_ENDPOINT,
        `query=${encodeURIComponent(query)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/sparql-results+json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('SPARQL Query Error:', error.message);
      throw error;
    }
  }

  async executeSparqlUpdate(query) {
    try {
      const response = await axios.post(
        config.UPDATE_ENDPOINT,
        `update=${encodeURIComponent(query)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('SPARQL Update Error:', error.message);
      throw error;
    }
  }

  async checkHealth() {
    try {
      await axios.get(`${config.FUSEKI_URL}/$/ping`);
      return {
        status: 'ok',
        fuseki: 'connected',
        endpoint: config.FUSEKI_URL,
        dataset: config.DATASET_NAME
      };
    } catch (error) {
      throw {
        status: 'error',
        fuseki: 'disconnected',
        error: error.message
      };
    }
  }
}

module.exports = new FusekiService();