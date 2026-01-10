const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');
const sparqlController = require('../controllers/sparqlController');
const provenanceController = require('../controllers/provenanceController');

// Upload routes
router.post('/upload', upload.single('file'), uploadController.uploadData);

// SPARQL routes
router.post('/sparql/query', sparqlController.executeQuery);
router.post('/sparql/update', sparqlController.executeUpdate);

// Provenance routes
router.get('/entities', provenanceController.getEntities);
router.get('/activities', provenanceController.getActivities);
router.get('/agents', provenanceController.getAgents);
router.get('/provenance-graph', provenanceController.getProvenanceGraph);
router.get('/resource', provenanceController.getResource);
router.post('/search', provenanceController.search);
router.get('/recommend', provenanceController.getRecommendations);
router.get('/stats', provenanceController.getStats);
router.get('/health', provenanceController.healthCheck);

module.exports = router;