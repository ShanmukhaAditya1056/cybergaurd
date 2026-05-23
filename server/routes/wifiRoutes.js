const express = require('express');
const router = express.Router();
const { analyzeWifi, getWifiHistory, autoScanWifi } = require('../controllers/wifiController');

router.post('/analyze', analyzeWifi);
router.post('/auto-scan', autoScanWifi);
router.get('/history', getWifiHistory);

module.exports = router;
