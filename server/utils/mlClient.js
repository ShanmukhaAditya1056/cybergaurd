/**
 * CyberGuard AI — ML Service Client
 * Calls the Python FastAPI ML service for real predictions
 * Falls back to rule-based logic if ML service is unavailable
 */
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
let mlServiceAvailable = null; // null = unknown, true/false = checked

/**
 * Check if ML service is running
 */
const checkMLService = async () => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 3000 });
    const wasAvailable = mlServiceAvailable;
    mlServiceAvailable = response.data.status === 'healthy';
    // Log status changes
    if (wasAvailable !== mlServiceAvailable) {
      if (mlServiceAvailable) {
        console.log('[ML Client] ✅ ML Service connected at', ML_SERVICE_URL);
      } else {
        console.log('[ML Client] ⚠️  ML Service health check failed');
      }
    }
    return mlServiceAvailable;
  } catch {
    if (mlServiceAvailable !== false) {
      console.log('[ML Client] ML Service not available, using rule-based fallback');
    }
    mlServiceAvailable = false;
    return false;
  }
};

/**
 * Get phishing prediction from ML service
 * @param {string} url - URL to analyze
 * @returns {object|null} - ML prediction or null if service unavailable
 */
const predictPhishing = async (url) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict/phishing`, { url }, { timeout: 5000 });
    return response.data;
  } catch (error) {
    console.log('[ML Client] Phishing prediction failed, using fallback:', error.message);
    return null;
  }
};

/**
 * Get malware prediction from ML service
 * @param {string} appName - App name
 * @param {string[]} permissions - List of Android permissions
 * @returns {object|null} - ML prediction or null if service unavailable
 */
const predictMalware = async (appName, permissions) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict/malware`, {
      app_name: appName,
      permissions
    }, { timeout: 5000 });
    return response.data;
  } catch (error) {
    console.log('[ML Client] Malware prediction failed, using fallback:', error.message);
    return null;
  }
};

// Check ML service on startup
checkMLService();

// Periodically re-check ML service availability (every 30 seconds)
// This allows the status to update dynamically when the Python service starts/stops
setInterval(checkMLService, 30000);

module.exports = {
  checkMLService,
  predictPhishing,
  predictMalware,
  isMLAvailable: () => mlServiceAvailable
};
