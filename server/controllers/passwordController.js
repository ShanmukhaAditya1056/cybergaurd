const { analyzePassword } = require('../utils/passwordStrength');

/**
 * POST /api/password/check
 * Analyze password strength — the password NEVER touches the database.
 * Analysis is done entirely in-memory and immediately discarded.
 */
const checkPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a password to check'
      });
    }

    // Analyze entirely in-memory — nothing stored
    const result = analyzePassword(password);

    res.json({
      success: true,
      data: result,
      privacyNote: 'Your password was analyzed in-memory and was NOT stored or logged.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { checkPassword };
