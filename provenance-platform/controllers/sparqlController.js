const fusekiService = require('../services/fusekiService');

exports.executeQuery = async (req, res) => {
  try {
    const { query } = req.body;
    const results = await fusekiService.executeSparql(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.executeUpdate = async (req, res) => {
  try {
    const { update } = req.body;
    await fusekiService.executeSparqlUpdate(update);
    res.json({ success: true, message: 'Update executed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};