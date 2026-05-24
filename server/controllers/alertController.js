const Alert = require('../models/Alert');

/**
 * GET /api/alerts
 * Get all alerts from the database
 */
const getAlerts = async (req, res) => {
  try {
    let alerts = await Alert.find().sort({ createdAt: -1 });

    // Filter by type if query param provided
    const { type } = req.query;
    if (type && type !== 'All') {
      alerts = alerts.filter(a => a.type === type.toUpperCase());
    }

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/alerts/:id/read
 * Mark an alert as read
 */
const markAsRead = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/alerts/:id
 * Delete a specific alert
 */
const deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/alerts/read-all
 * Mark all alerts as read
 */
const markAllAsRead = async (req, res) => {
  try {
    const result = await Alert.updateMany(
      { read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} alert(s) marked as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/alerts/all
 * Delete all alerts
 */
const deleteAllAlerts = async (req, res) => {
  try {
    const result = await Alert.deleteMany({});

    res.json({
      success: true,
      message: `${result.deletedCount} alert(s) deleted`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAlerts,
  markAsRead,
  markAllAsRead,
  deleteAlert,
  deleteAllAlerts
};
