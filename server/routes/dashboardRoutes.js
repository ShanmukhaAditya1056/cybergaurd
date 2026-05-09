const express = require('express');
const router = express.Router();
const { getSecurityScore, getStats } = require('../controllers/dashboardController');

router.get('/score', getSecurityScore);
router.get('/stats', getStats);

module.exports = router;
