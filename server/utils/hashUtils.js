const crypto = require('crypto');

/**
 * Generate SHA-1 hash of input string
 * Used for k-Anonymity in breach checking
 */
const sha1Hash = (input) => {
  return crypto
    .createHash('sha1')
    .update(input.trim().toLowerCase())
    .digest('hex')
    .toUpperCase();
};

/**
 * Generate SHA-256 hash of input string
 * Used for general hashing purposes
 */
const sha256Hash = (input) => {
  return crypto
    .createHash('sha256')
    .update(input.trim().toLowerCase())
    .digest('hex')
    .toUpperCase();
};

/**
 * Get k-Anonymity prefix and suffix from SHA-1 hash
 * Returns first 5 characters as prefix and remainder as suffix
 */
const getKAnonymityParts = (input) => {
  const hash = sha1Hash(input);
  return {
    prefix: hash.substring(0, 5),
    suffix: hash.substring(5),
    fullHash: hash
  };
};

module.exports = {
  sha1Hash,
  sha256Hash,
  getKAnonymityParts
};
