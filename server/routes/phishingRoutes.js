const express = require('express');
const router = express.Router();
const { scanPhishing, getPhishingHistory, clearPhishingHistory } = require('../controllers/phishingController');
const { scanLimiter, writeLimiter } = require('../middleware/rateLimiter');

router.post('/scan', scanLimiter, scanPhishing);
router.get('/history', getPhishingHistory);
router.delete('/history', writeLimiter, clearPhishingHistory);

module.exports = router;
