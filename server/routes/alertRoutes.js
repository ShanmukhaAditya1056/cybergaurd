const express = require('express');
const router = express.Router();
const { getAlerts, markAsRead, markAllAsRead, deleteAlert, deleteAllAlerts } = require('../controllers/alertController');
const { writeLimiter } = require('../middleware/rateLimiter');

router.get('/', getAlerts);
router.patch('/read-all', writeLimiter, markAllAsRead);     // Must come before /:id routes
router.delete('/all', writeLimiter, deleteAllAlerts);       // Must come before /:id routes
router.patch('/:id/read', writeLimiter, markAsRead);
router.delete('/:id', writeLimiter, deleteAlert);

module.exports = router;
