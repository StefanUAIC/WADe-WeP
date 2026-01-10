const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

router.get('/browse', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'browse.html'));
});

router.get('/query', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'query.html'));
});

router.get('/sparql', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'sparql.html'));
});

router.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'upload.html'));
});

router.get('/visualize', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'visualize.html'));
});

module.exports = router;