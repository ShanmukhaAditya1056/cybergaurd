const express = require('express');
const router = express.Router();
const { analyzeWifi, getWifiHistory, autoScanWifi, clearWifiHistory } = require('../controllers/wifiController');
const { scanLimiter, writeLimiter } = require('../middleware/rateLimiter');

router.post('/analyze', scanLimiter, analyzeWifi);
router.post('/auto-scan', scanLimiter, autoScanWifi);
router.get('/history', getWifiHistory);
router.delete('/history', writeLimiter, clearWifiHistory);

module.exports = router;
