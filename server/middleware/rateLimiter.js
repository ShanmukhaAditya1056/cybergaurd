const rateLimit = require('express-rate-limit');

/**
 * Tiered rate limiters for different endpoint categories
 * More restrictive limits on compute-heavy scan endpoints
 */

/**
 * General limiter — for read/GET endpoints
 * 500 requests per 15 minutes per IP
 * (generous for development — polling endpoints fire frequently)
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for polling/health-check endpoints
  skip: (req) => {
    const skipPaths = [
      '/api/health',
      '/api/alerts',
      '/api/dashboard/score',
      '/api/dashboard/stats',
    ];
    // Skip GET requests to polling endpoints
    if (req.method === 'GET' && skipPaths.some(p => req.path === p || req.originalUrl === p)) {
      return true;
    }
    return false;
  }
});

/**
 * Scan limiter — for heavy compute endpoints (phishing/scan, malware/scan, wifi/analyze, etc.)
 * 30 requests per 15 minutes per IP
 */
const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: {
    success: false,
    message: 'Scan rate limit exceeded. Please wait before running more scans.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Write limiter — for mutation/delete endpoints (alerts, settings)
 * 100 requests per 15 minutes per IP
 */
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many write requests. Please try again shortly.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { generalLimiter, scanLimiter, writeLimiter };
