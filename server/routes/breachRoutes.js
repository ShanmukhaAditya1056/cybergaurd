const express = require('express');
const router = express.Router();
const { checkBreach, getBreachHistory } = require('../controllers/breachController');
const rateLimiter = require('../middleware/rateLimiter');

router.post('/check', rateLimiter, checkBreach);
router.get('/history', getBreachHistory);

module.exports = router;
