const express = require('express');
const router = express.Router();
const { scanPhishing, getPhishingHistory } = require('../controllers/phishingController');
const rateLimiter = require('../middleware/rateLimiter');

router.post('/scan', rateLimiter, scanPhishing);
router.get('/history', getPhishingHistory);

module.exports = router;
