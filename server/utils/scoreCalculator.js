/**
 * Calculate unified security score from all module scores
 * Weights: Malware(35%) + Phishing(30%) + Breach(25%) + WiFi(10%)
 * If breach found, cap score at 45
 */
const calculateUnifiedScore = (phishingScore, malwareScore, breachScore, wifiScore, breachFound) => {
  const weighted =
    (phishingScore * 0.30) +
    (malwareScore * 0.35) +
    (breachScore * 0.25) +
    (wifiScore * 0.10);

  if (breachFound) return Math.min(Math.round(weighted), 45);
  return Math.round(weighted);
};

/**
 * Calculate phishing module score
 * Starts at 100, subtract 30 per phishing detected in last 24h, min 0
 */
const calculatePhishingScore = (phishingDetectedCount) => {
  return Math.max(0, 100 - (phishingDetectedCount * 30));
};

/**
 * Calculate malware module score
 * Starts at 100, subtract by risk level
 * CRITICAL=-40, HIGH=-20, MEDIUM=-10, LOW=0
 */
const calculateMalwareScore = (apps) => {
  let score = 100;
  if (!apps || apps.length === 0) return score;

  apps.forEach(app => {
    switch (app.risk) {
      case 'CRITICAL':
        score -= 40;
        break;
      case 'HIGH':
        score -= 20;
        break;
      case 'MEDIUM':
        score -= 10;
        break;
      case 'LOW':
      default:
        break;
    }
  });

  return Math.max(0, score);
};

/**
 * Calculate breach module score
 * 100 if no breach found, 0 if breach found
 */
const calculateBreachScore = (breachFound) => {
  return breachFound ? 0 : 100;
};

/**
 * Calculate WiFi module score
 * Uses trust_score from last wifi scan, default 80 if no scan
 */
const calculateWifiScore = (trustScore) => {
  if (trustScore === null || trustScore === undefined) return 80;
  return Math.max(0, Math.min(100, trustScore));
};

/**
 * Get score color level based on score value
 * 70-100 = SAFE (green), 40-69 = WARNING (amber), 0-39 = CRITICAL (red)
 */
const getScoreLevel = (score) => {
  if (score >= 70) return 'SAFE';
  if (score >= 40) return 'WARNING';
  return 'CRITICAL';
};

module.exports = {
  calculateUnifiedScore,
  calculatePhishingScore,
  calculateMalwareScore,
  calculateBreachScore,
  calculateWifiScore,
  getScoreLevel
};
