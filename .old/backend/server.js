require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const articlesRouter = require('./routes/articles');
const sparqlRouter = require('./routes/sparql');
const metadataRouter = require('./routes/metadata');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.use('/api/articles', articlesRouter);
app.use('/api/sparql', sparqlRouter);
app.use('/api/metadata', metadataRouter);

// Root endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'News Provenance Platform API',
    version: '1.0.0',
    endpoints: {
      articles: '/api/articles',
      sparql: '/api/sparql',
      metadata: '/api/metadata'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Not Found',
      status: 404
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Frontend available at http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});