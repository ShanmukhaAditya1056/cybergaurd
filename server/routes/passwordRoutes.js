const express = require('express');
const router = express.Router();
const { checkPassword } = require('../controllers/passwordController');
const { scanLimiter } = require('../middleware/rateLimiter');

router.post('/check', scanLimiter, checkPassword);

module.exports = router;
