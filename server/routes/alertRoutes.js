const express = require('express');
const router = express.Router();
const { getAlerts, markAsRead, deleteAlert } = require('../controllers/alertController');

router.get('/', getAlerts);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteAlert);

module.exports = router;
