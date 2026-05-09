const ScanResult = require('../models/ScanResult');
const Alert = require('../models/Alert');
const { detectPhishing } = require('../utils/phishingDetector');

/**
 * POST /api/phishing/scan
 * Scan a URL or message for phishing indicators
 */
const scanPhishing = async (req, res) => {
  try {
    const { input } = req.body;

    if (!input || input.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a URL or message to scan'
      });
    }

    // Run phishing detection
    const result = detectPhishing(input);

    // Save scan result to MongoDB
    const scanResult = await ScanResult.create({
      type: 'phishing',
      input: input.substring(0, 500), // Limit stored input length
      verdict: result.verdict,
      score: result.confidence,
      confidence: result.confidence,
      details: {
        threat_level: result.threat_level,
        shap_reasons: result.shap_reasons,
        url: result.url,
        domain: result.domain
      }
    });

    // Create alert if phishing detected
    if (result.verdict === 'PHISHING') {
      await Alert.create({
        type: result.threat_level === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        title: `Phishing URL Detected: ${result.domain}`,
        description: `A suspicious URL was flagged with ${result.confidence}% confidence. ${result.shap_reasons[0]?.description || 'Multiple phishing indicators found.'}`,
        module: 'Phishing Scanner'
      });
    }

    res.json({
      success: true,
      data: {
        id: scanResult._id,
        verdict: result.verdict,
        confidence: result.confidence,
        threat_level: result.threat_level,
        shap_reasons: result.shap_reasons,
        url: result.url,
        domain: result.domain,
        scannedAt: scanResult.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/phishing/history
 * Get scan history for phishing module
 */
const getPhishingHistory = async (req, res) => {
  try {
    const history = await ScanResult.find({ type: 'phishing' })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('input verdict score confidence details createdAt');

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  scanPhishing,
  getPhishingHistory
};
