/**
 * Score utility functions for the client-side
 */

/**
 * Get the color class based on score value
 * 70-100 = safe (green), 40-69 = warning (amber), 0-39 = critical (red)
 */
export const getScoreColorClass = (score) => {
  if (score >= 70) return 'text-safe';
  if (score >= 40) return 'text-warn';
  return 'text-danger';
};

/**
 * Get the background color class for score
 */
export const getScoreBgClass = (score) => {
  if (score >= 70) return 'bg-safe';
  if (score >= 40) return 'bg-warn';
  return 'bg-danger';
};

/**
 * Get the score level label
 */
export const getScoreLevel = (score) => {
  if (score >= 70) return 'SAFE';
  if (score >= 40) return 'WARNING';
  return 'CRITICAL';
};

/**
 * Get the hex color for score
 */
export const getScoreHexColor = (score) => {
  if (score >= 70) return '#4CAF82';
  if (score >= 40) return '#F0A030';
  return '#E05555';
};

/**
 * Format a timestamp to relative time string
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Never';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/**
 * Format a number with abbreviation (K, M)
 */
export const formatNumber = (num) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
};
