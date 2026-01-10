const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const RDFService = require('../services/rdf.service');
const FusekiService = require('../services/fuseki.service');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const rdfService = new RDFService();
const fusekiService = new FusekiService();

// Validation rules
const articleValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('author').notEmpty().withMessage('Author is required'),
  body('language').isIn(['en', 'ro', 'es', 'fr', 'de']).withMessage('Invalid language'),
  body('contentType').isIn(['text', 'multimedia', 'audio', 'video']).withMessage('Invalid content type')
];

// GET all articles
router.get('/', async (req, res) => {
  try {
    const { language, topic, limit = 50 } = req.query;
    const articles = await fusekiService.getAllArticles({ language, topic, limit });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single article by ID
router.get('/:id', async (req, res) => {
  try {
    const article = await fusekiService.getArticleById(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new article
router.post('/', articleValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const articleId = uuidv4();
    const articleData = {
      id: articleId,
      ...req.body,
      createdAt: new Date().toISOString(),
      url: `${process.env.BASE_URL}/articles/${articleId}`
    };

    // Generate RDF
    const rdfData = rdfService.createArticleRDF(articleData);

    // Store in Fuseki
    await fusekiService.insertArticle(rdfData);

    // Generate QR code
    const qrCode = await QRCode.toDataURL(articleData.url);

    res.status(201).json({
      ...articleData,
      qrCode
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update article
router.put('/:id', articleValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const articleData = {
      id: req.params.id,
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    const rdfData = rdfService.createArticleRDF(articleData);
    await fusekiService.updateArticle(req.params.id, rdfData);

    res.json(articleData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE article
router.delete('/:id', async (req, res) => {
  try {
    await fusekiService.deleteArticle(req.params.id);
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET article metadata
router.get('/:id/metadata', async (req, res) => {
  try {
    const metadata = await fusekiService.getArticleMetadata(req.params.id);
    res.json(metadata);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET article RDFa representation
router.get('/:id/rdf', async (req, res) => {
  try {
    const article = await fusekiService.getArticleById(req.params.id);
    const rdfData = rdfService.createArticleRDF(article);
    res.set('Content-Type', 'application/rdf+xml');
    res.send(rdfData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET article JSON-LD representation
router.get('/:id/jsonld', async (req, res) => {
  try {
    const article = await fusekiService.getArticleById(req.params.id);
    const jsonld = rdfService.createArticleJSONLD(article);
    res.json(jsonld);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;