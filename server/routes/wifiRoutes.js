const express = require('express');
const router = express.Router();
const { analyzeWifi, getWifiHistory } = require('../controllers/wifiController');

router.post('/analyze', analyzeWifi);
router.get('/history', getWifiHistory);

module.exports = router;
