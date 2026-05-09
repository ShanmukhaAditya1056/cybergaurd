const rateLimit = require('express-rate-limit');

/**
 * Rate limiter middleware
 * Limits API requests to prevent abuse
 * 100 requests per 15 minutes per IP
 */
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = rateLimiter;
