const express = require('express');
const router = express.Router();
const { checkBreach, getBreachHistory, clearBreachHistory } = require('../controllers/breachController');
const { scanLimiter, writeLimiter } = require('../middleware/rateLimiter');

router.post('/check', scanLimiter, checkBreach);
router.get('/history', getBreachHistory);
router.delete('/history', writeLimiter, clearBreachHistory);

module.exports = router;
