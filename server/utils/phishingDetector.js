/**
 * Phishing Detection Engine
 * Rule-based detection simulating DistilBERT NLP analysis
 */

const SUSPICIOUS_KEYWORDS = [
  'verify-now', 'login-update', 'otp-confirm', 'kyc-update', 'aadhaar-verify',
  'upi-reward', 'claim-prize', 'secure-hdfc', 'sbi-alert', 'paytm-verify',
  'free-jio', 'win-prize', 'trai-notice', 'account-suspended', 'urgent-action',
  'click-now', 'limited-time', 'expire-today', 'verify-account', 'update-kyc',
  'reward-claim', 'lucky-winner', 'confirm-identity', 'reset-password',
  'login', 'signin', 'sign-in', 'password', 'credential',
  'verify', 'validate', 'confirm', 'secure', 'update',
  'account', 'banking', 'payment', 'wallet', 'transfer',
  'suspend', 'blocked', 'unauthorized', 'unusual-activity',
  'refund', 'cashback', 'offer', 'free', 'prize', 'winner',
  'click-here', 'act-now', 'immediate', 'urgently',
];

const SUSPICIOUS_TLDS = [
  '.xyz', '.tk', '.ml', '.ga', '.cf', '.click', '.top', '.work',
  '.loan', '.gq', '.pw', '.buzz', '.icu', '.cam', '.rest',
  '.monster', '.fit', '.surf', '.bar', '.space', '.site',
];

// Well-known brands that phishers impersonate
const BRAND_NAMES = [
  'google', 'facebook', 'apple', 'microsoft', 'amazon', 'netflix',
  'paypal', 'instagram', 'whatsapp', 'telegram', 'twitter', 'linkedin',
  'sbi', 'hdfc', 'icici', 'axis', 'paytm', 'phonepe', 'gpay',
  'flipkart', 'snapdeal', 'myntra', 'zomato', 'swiggy', 'ola', 'uber',
  'yahoo', 'outlook', 'gmail', 'hotmail', 'dropbox', 'adobe',
  'chase', 'wellsfargo', 'citibank', 'bankofamerica',
];

const SAFE_DOMAINS = [
  'google.com', 'paytm.com', 'phonepe.com', 'gpay.com', 'npci.org.in',
  'sbi.co.in', 'hdfcbank.com', 'icicibank.com', 'axisbank.com', 'amazon.in',
  'flipkart.com', 'jio.com', 'airtel.in', 'bsnl.co.in', 'incometax.gov.in',
  'uidai.gov.in', 'facebook.com', 'instagram.com', 'twitter.com', 'x.com',
  'linkedin.com', 'github.com', 'stackoverflow.com', 'reddit.com',
  'apple.com', 'microsoft.com', 'amazon.com', 'netflix.com', 'youtube.com',
  'whatsapp.com', 'telegram.org', 'wikipedia.org', 'mozilla.org',
  'paypal.com', 'stripe.com', 'spotify.com', 'zoom.us',
  'yahoo.com', 'outlook.com', 'live.com', 'office.com',
  'dropbox.com', 'adobe.com', 'cloudflare.com',
  'gmail.com', 'mail.google.com',
];

/**
 * Extract domain from URL string
 */
const extractDomain = (input) => {
  try {
    let url = input.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase();
  } catch {
    return null;
  }
};

/**
 * Check if input contains a URL
 */
const extractUrlFromText = (text) => {
  const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}[^\s]*/gi;
  const matches = text.match(urlRegex);
  return matches ? matches[0] : text;
};

/**
 * Main phishing detection function
 * Returns verdict, confidence, threat_level, and SHAP reasons
 */
const detectPhishing = (input) => {
  const url = extractUrlFromText(input);
  const lowerInput = input.toLowerCase();
  const lowerUrl = url.toLowerCase();
  const domain = extractDomain(url);

  let suspicionScore = 0;
  const shapReasons = [];

  // Rule 1: Check safe domains whitelist
  if (domain) {
    const isSafe = SAFE_DOMAINS.some(safeDomain =>
      domain === safeDomain || domain.endsWith('.' + safeDomain)
    );
    if (isSafe) {
      return {
        verdict: 'SAFE',
        confidence: 98,
        threat_level: 'NONE',
        shap_reasons: [
          { feature: 'Trusted Domain', score: -0.95, direction: 'safe', description: `${domain} is a verified legitimate domain` }
        ],
        url: url,
        domain: domain
      };
    }
  }

  // Rule 2: Check suspicious keywords
  const foundKeywords = SUSPICIOUS_KEYWORDS.filter(keyword =>
    lowerInput.includes(keyword) || lowerUrl.includes(keyword)
  );
  if (foundKeywords.length >= 3) {
    suspicionScore += 45;
    shapReasons.push({
      feature: 'Multiple Suspicious Keywords',
      score: 0.85,
      direction: 'danger',
      description: `Found ${foundKeywords.length} phishing keywords: ${foundKeywords.slice(0, 3).join(', ')}`
    });
  } else if (foundKeywords.length >= 1) {
    suspicionScore += 20 * foundKeywords.length;
    shapReasons.push({
      feature: 'Suspicious Keywords',
      score: 0.15 * foundKeywords.length,
      direction: 'warning',
      description: `Found keywords: ${foundKeywords.join(', ')}`
    });
  }

  // Rule 3: Check suspicious TLDs
  const hasSuspiciousTLD = SUSPICIOUS_TLDS.some(tld => lowerUrl.endsWith(tld) || lowerUrl.includes(tld + '/'));
  if (hasSuspiciousTLD) {
    suspicionScore += 35;
    const matchedTLD = SUSPICIOUS_TLDS.find(tld => lowerUrl.endsWith(tld) || lowerUrl.includes(tld + '/'));
    shapReasons.push({
      feature: 'Suspicious TLD',
      score: 0.72,
      direction: 'danger',
      description: `Domain uses high-risk TLD: ${matchedTLD}`
    });
  }

  // Rule 4: Check for IP address as domain
  const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
  if (domain && ipRegex.test(domain)) {
    suspicionScore += 40;
    shapReasons.push({
      feature: 'IP Address Domain',
      score: 0.82,
      direction: 'danger',
      description: 'URL uses IP address instead of domain name — common phishing technique'
    });
  }

  // Rule 5: Check for excessive hyphens in domain
  if (domain) {
    const hyphenCount = (domain.match(/-/g) || []).length;
    if (hyphenCount >= 3) {
      suspicionScore += 25;
      shapReasons.push({
        feature: 'Excessive Hyphens',
        score: 0.55,
        direction: 'warning',
        description: `Domain contains ${hyphenCount} hyphens — often used to mimic legitimate URLs`
      });
    }
  }

  // Rule 6: Check URL length
  if (url.length > 100) {
    suspicionScore += 10;
    shapReasons.push({
      feature: 'Excessive URL Length',
      score: 0.25,
      direction: 'warning',
      description: `URL is ${url.length} characters long — unusually long URLs may hide malicious content`
    });
  }

  // Additional: Check for @ symbol in URL (credential harvesting)
  if (lowerUrl.includes('@')) {
    suspicionScore += 20;
    shapReasons.push({
      feature: '@ Symbol in URL',
      score: 0.48,
      direction: 'warning',
      description: 'URL contains @ symbol — may redirect to different domain'
    });
  }

  // Additional: Check for URL shortener patterns
  const shorteners = ['bit.ly', 'tinyurl', 'goo.gl', 't.co', 'short.link', 'is.gd', 'rb.gy', 'cutt.ly'];
  const hasShortener = shorteners.some(s => lowerUrl.includes(s));
  if (hasShortener) {
    suspicionScore += 15;
    shapReasons.push({
      feature: 'URL Shortener',
      score: 0.35,
      direction: 'warning',
      description: 'Shortened URL may hide malicious destination'
    });
  }

  // Rule 8: Check for brand impersonation in domain
  if (domain) {
    const domainParts = domain.split('.');
    const mainDomain = domainParts.length >= 2 ? domainParts[domainParts.length - 2] : domain;
    for (const brand of BRAND_NAMES) {
      // Check if brand appears in subdomain but NOT as the main domain
      if (domain.includes(brand) && !mainDomain.includes(brand)) {
        suspicionScore += 35;
        shapReasons.push({
          feature: 'Brand Impersonation',
          score: 0.78,
          direction: 'danger',
          description: `"${brand}" appears in subdomain — likely impersonation attempt`
        });
        break;
      }
      // Check if brand is in domain but misspelled (e.g., gooogle, amaz0n)
      if (mainDomain.includes(brand) && !SAFE_DOMAINS.some(sd => domain.endsWith(sd))) {
        suspicionScore += 30;
        shapReasons.push({
          feature: 'Potential Brand Mimicry',
          score: 0.70,
          direction: 'danger',
          description: `Domain contains "${brand}" but is not the official site`
        });
        break;
      }
    }
  }

  // Rule 9: HTTP without S (no SSL)
  if (lowerUrl.startsWith('http://') && !lowerUrl.startsWith('http://localhost')) {
    suspicionScore += 10;
    shapReasons.push({
      feature: 'No SSL/HTTPS',
      score: 0.30,
      direction: 'warning',
      description: 'URL uses insecure HTTP — legitimate sites use HTTPS'
    });
  }

  // Rule 10: Unusual subdomain depth
  if (domain) {
    const subdomainCount = domain.split('.').length - 2;
    if (subdomainCount >= 3) {
      suspicionScore += 15;
      shapReasons.push({
        feature: 'Deep Subdomain',
        score: 0.40,
        direction: 'warning',
        description: `Domain has ${subdomainCount} subdomain levels — used to hide real destination`
      });
    }
  }

  // Calculate final results
  const confidence = Math.min(99, Math.max(10, suspicionScore + 10));
  const isPhishing = suspicionScore >= 30;

  let threat_level;
  if (suspicionScore >= 70) threat_level = 'CRITICAL';
  else if (suspicionScore >= 50) threat_level = 'HIGH';
  else if (suspicionScore >= 30) threat_level = 'MEDIUM';
  else threat_level = 'LOW';

  if (!isPhishing && shapReasons.length === 0) {
    shapReasons.push({
      feature: 'No Threats Detected',
      score: -0.80,
      direction: 'safe',
      description: 'No phishing indicators found in the URL or message'
    });
  }

  return {
    verdict: isPhishing ? 'PHISHING' : 'SAFE',
    confidence: isPhishing ? confidence : Math.max(65, 100 - suspicionScore),
    threat_level: isPhishing ? threat_level : 'NONE',
    shap_reasons: shapReasons,
    url: url,
    domain: domain || 'unknown'
  };
};

module.exports = {
  detectPhishing,
  SUSPICIOUS_KEYWORDS,
  SUSPICIOUS_TLDS,
  SAFE_DOMAINS,
  BRAND_NAMES
};
