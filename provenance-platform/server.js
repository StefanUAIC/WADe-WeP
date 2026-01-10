const express = require('express');
const path = require('path');
const config = require('./config/fuseki');
const routes = require('./routes');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Setup routes
routes(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║   Provenance Management Platform                          ║
║   Running on http://localhost:${PORT}                        ║
║                                                            ║
║   Fuseki: ${config.FUSEKI_URL}                    ║
║   Dataset: ${config.DATASET_NAME}                           ║
╚════════════════════════════════════════════════════════════╝
  `);
});