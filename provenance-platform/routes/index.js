const express = require('express');
const apiRoutes = require('./api');
const pageRoutes = require('./pages');

module.exports = (app) => {
  app.use('/api', apiRoutes);
  app.use('/', pageRoutes);
};