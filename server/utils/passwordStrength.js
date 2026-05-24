/**
 * CyberGuard AI — Password Strength Analyzer
 * Real entropy calculation, dictionary detection, and pattern analysis.
 */

// Common weak passwords (top 100 from breach databases)
const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', 'master',
  'dragon', '111111', 'baseball', 'iloveyou', 'trustno1', 'sunshine',
  'princess', 'football', 'charlie', 'access', 'shadow', 'michael',
  'superman', '696969', 'batman', 'password1', 'password123', 'letmein',
  'welcome', 'admin', 'login', 'starwars', '123123', '654321', 'passw0rd',
  '1q2w3e4r', 'qwerty123', 'google', 'nothing', 'hello', '000000',
  '1234', '12345', '123456789', '1234567', '1234567890',
  'india', 'india123', 'pass@123', 'admin123', 'root', 'toor',
  'test', 'guest', 'changeme', 'default', 'pass', 'pass123',
]);

// Sequential and keyboard patterns
const PATTERNS = [
  /^(.)\1{3,}$/,                    // Repeated chars: aaaa
  /^(012|123|234|345|456|567|678|789)+/, // Sequential numbers
  /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+/i, // Sequential letters
  /^(qwer|wert|erty|rtyu|tyui|yuio|uiop|asdf|sdfg|dfgh|fghj|ghjk|hjkl|zxcv|xcvb|cvbn|vbnm)+/i, // Keyboard walks
];

/**
 * Calculate Shannon entropy of a string
 */
function calculateEntropy(password) {
  const charsetSize = getCharsetSize(password);
  return password.length * Math.log2(charsetSize || 1);
}

/**
 * Get charset size based on character types present
 */
function getCharsetSize(password) {
  let size = 0;
  if (/[a-z]/.test(password)) size += 26;
  if (/[A-Z]/.test(password)) size += 26;
  if (/[0-9]/.test(password)) size += 10;
  if (/[^a-zA-Z0-9]/.test(password)) size += 33;
  return size;
}

/**
 * Analyze password strength and return detailed results
 */
function analyzePassword(password) {
  if (!password || password.length === 0) {
    return {
      score: 0,
      strength: 'NONE',
      entropy: 0,
      crackTime: 'Instant',
      feedback: [{ type: 'error', message: 'Password is empty' }],
      checks: {},
    };
  }

  const feedback = [];
  let score = 0;

  // ---- Character type checks ----
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const uniqueChars = new Set(password).size;

  const checks = {
    length: password.length >= 8,
    lowercase: hasLower,
    uppercase: hasUpper,
    digit: hasDigit,
    special: hasSpecial,
    noCommon: !COMMON_PASSWORDS.has(password.toLowerCase()),
    noPattern: !PATTERNS.some(p => p.test(password.toLowerCase())),
    uniqueChars: uniqueChars >= Math.min(6, password.length),
  };

  // ---- Scoring ----
  // Length scoring (max 30)
  if (password.length >= 16) score += 30;
  else if (password.length >= 12) score += 25;
  else if (password.length >= 8) score += 15;
  else if (password.length >= 6) score += 8;
  else score += 3;

  // Character diversity (max 25)
  const diversity = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
  score += diversity * 6;

  // Unique characters (max 15)
  const uniqueRatio = uniqueChars / password.length;
  score += Math.round(uniqueRatio * 15);

  // Entropy bonus (max 15)
  const entropy = calculateEntropy(password);
  if (entropy >= 60) score += 15;
  else if (entropy >= 40) score += 10;
  else if (entropy >= 28) score += 5;

  // Penalties
  if (!checks.noCommon) {
    score = Math.min(score, 10);
    feedback.push({ type: 'error', message: 'This is a commonly breached password — easily guessable' });
  }

  if (!checks.noPattern) {
    score = Math.max(0, score - 20);
    feedback.push({ type: 'warning', message: 'Contains keyboard or sequential pattern — avoid predictable sequences' });
  }

  if (password.length < 8) {
    feedback.push({ type: 'error', message: 'Too short — use at least 8 characters (12+ recommended)' });
  }

  if (!hasUpper && hasLower) feedback.push({ type: 'tip', message: 'Add uppercase letters for more strength' });
  if (!hasDigit) feedback.push({ type: 'tip', message: 'Add numbers to increase complexity' });
  if (!hasSpecial) feedback.push({ type: 'tip', message: 'Add special characters (!@#$%^&*) for best security' });
  if (uniqueRatio < 0.5) feedback.push({ type: 'warning', message: 'Too many repeated characters' });

  if (score >= 80 && feedback.length === 0) {
    feedback.push({ type: 'success', message: 'Excellent password! Strong and hard to crack.' });
  } else if (score >= 60 && feedback.filter(f => f.type === 'error').length === 0) {
    feedback.push({ type: 'success', message: 'Good password — consider making it longer for extra security.' });
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine strength level
  let strength;
  if (score >= 80) strength = 'STRONG';
  else if (score >= 60) strength = 'GOOD';
  else if (score >= 40) strength = 'FAIR';
  else if (score >= 20) strength = 'WEAK';
  else strength = 'VERY_WEAK';

  // Estimate crack time (assuming 10 billion guesses/second)
  const guessesPerSecond = 10_000_000_000;
  const combinations = Math.pow(getCharsetSize(password), password.length);
  const secondsToCrack = combinations / guessesPerSecond / 2; // Average case
  const crackTime = formatCrackTime(secondsToCrack);

  return {
    score,
    strength,
    entropy: Math.round(entropy * 10) / 10,
    crackTime,
    feedback,
    checks,
    length: password.length,
    charsetSize: getCharsetSize(password),
  };
}

function formatCrackTime(seconds) {
  if (seconds < 0.001) return 'Instant';
  if (seconds < 1) return 'Less than a second';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 86400 * 30) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 86400 * 365) return `${Math.round(seconds / (86400 * 30))} months`;
  if (seconds < 86400 * 365 * 1000) return `${Math.round(seconds / (86400 * 365))} years`;
  if (seconds < 86400 * 365 * 1e6) return `${Math.round(seconds / (86400 * 365 * 1000))}K years`;
  if (seconds < 86400 * 365 * 1e9) return `${Math.round(seconds / (86400 * 365 * 1e6))}M years`;
  return 'Centuries+';
}

module.exports = { analyzePassword };
