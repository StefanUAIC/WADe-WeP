const axios = require('axios');
const config = require('../config/fuseki');

exports.uploadData = async (req, res) => {
  try {
    let data, contentType;
    if (req.file) {
      data = req.file.buffer.toString('utf-8');
      
      contentType = 'text/turtle';
    } else if (req.body.data) {
      data = req.body.data;
      contentType = req.body.format || 'text/turtle';
    } else {
      return res.status(400).json({ success: false, error: 'No data provided' });
    }

    await axios.post(config.DATA_ENDPOINT, data, {
      headers: {
        'Content-Type': contentType
      }
    });

    res.json({
      success: true,
      message: 'Data uploaded successfully to Fuseki'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};