/**
 * CyberGuard AI — Demo Mode mock backend.
 *
 * GitHub Pages can only serve static files, so there is no Express/ML backend
 * reachable from the deployed site. When REACT_APP_DEMO_MODE === 'true' the
 * RTK Query baseQuery (see apiSlice.js) routes every request through
 * `handleDemoRequest` instead of the network. The responses mirror the exact
 * `{ success, data }` envelopes returned by the real server controllers so the
 * UI renders identically — which lets Selenium run meaningful end-to-end tests
 * against the live Pages URL.
 *
 * All logic here is DETERMINISTIC: the same input always yields the same
 * verdict. The E2E test-case generator (e2e-tests/data/generate_cases.py)
 * mirrors these rules so expected outcomes stay in sync.
 */

// ---------------------------------------------------------------------------
// Deterministic classifiers (kept in sync with e2e-tests/data/generate_cases.py)
// ---------------------------------------------------------------------------

const PHISHING_KEYWORDS = [
  'login', 'verify', 'secure', 'account', 'update', 'confirm', 'suspend',
  'bank', 'otp', 'password', 'signin', 'wallet', 'free', 'win', 'gift',
  'bonus', 'prize', 'claim', 'urgent', 'unlock', 'reset',
];
const SUSPICIOUS_TLDS = ['.xyz', '.tk', '.ml', '.ga', '.cf', '.gq', '.top', '.zip', '.mom'];
const SAFE_DOMAINS = [
  'google.com', 'github.com', 'microsoft.com', 'apple.com', 'amazon.com',
  'wikipedia.org', 'cloudflare.com', 'mozilla.org', 'paypal.com', 'netflix.com',
];

const IPV4_HOST = /\/\/(\d{1,3}\.){3}\d{1,3}/;

export function classifyPhishing(rawInput) {
  const input = (rawInput || '').toLowerCase().trim();
  const reasons = [];
  let suspicion = 0;

  const isSafeDomain = SAFE_DOMAINS.some((d) => input.includes(d));

  if (IPV4_HOST.test(input)) {
    suspicion += 45;
    reasons.push({ feature: 'Raw IP address in URL', score: 0.62, direction: 'danger', description: 'Legitimate sites use domain names, not raw IPs' });
  }
  if (SUSPICIOUS_TLDS.some((t) => input.includes(t))) {
    suspicion += 35;
    reasons.push({ feature: 'Suspicious top-level domain', score: 0.48, direction: 'danger', description: 'This TLD is frequently abused for phishing campaigns' });
  }
  if (input.includes('@') && input.includes('http')) {
    suspicion += 25;
    reasons.push({ feature: 'Embedded credentials / @ in URL', score: 0.4, direction: 'danger', description: 'The @ symbol can hide the true destination host' });
  }
  const matchedKeywords = PHISHING_KEYWORDS.filter((k) => input.includes(k));
  if (matchedKeywords.length > 0 && !isSafeDomain) {
    suspicion += 20 + matchedKeywords.length * 8;
    reasons.push({ feature: `Phishing keywords: ${matchedKeywords.slice(0, 3).join(', ')}`, score: 0.44, direction: 'danger', description: 'Urgent/credential-harvesting language detected' });
  }
  if (input.includes('xn--')) {
    suspicion += 30;
    reasons.push({ feature: 'Punycode homograph domain', score: 0.5, direction: 'danger', description: 'Punycode can impersonate trusted brands' });
  }

  const isPhishing = suspicion >= 40 && !isSafeDomain;
  const confidence = isPhishing
    ? Math.min(99, 55 + suspicion)
    : Math.max(65, 100 - suspicion);

  if (!isPhishing && reasons.length === 0) {
    reasons.push({ feature: 'No Threats Detected', score: -0.8, direction: 'safe', description: 'No phishing indicators found in the URL or message' });
  }

  let threat_level = 'NONE';
  if (isPhishing) {
    if (suspicion >= 80) threat_level = 'CRITICAL';
    else if (suspicion >= 60) threat_level = 'HIGH';
    else threat_level = 'MEDIUM';
  }

  return {
    input: (rawInput || '').substring(0, 500),
    verdict: isPhishing ? 'PHISHING' : 'SAFE',
    confidence,
    threat_level,
    shap_reasons: reasons,
    url: rawInput,
    domain: extractDomain(rawInput),
  };
}

function extractDomain(input) {
  try {
    const u = new URL(input.includes('://') ? input : `http://${input}`);
    return u.hostname;
  } catch {
    return 'unknown';
  }
}

function getCharsetSize(pw) {
  let size = 0;
  if (/[a-z]/.test(pw)) size += 26;
  if (/[A-Z]/.test(pw)) size += 26;
  if (/[0-9]/.test(pw)) size += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) size += 33;
  return size;
}

const COMMON_PASSWORDS = ['password', '123456', '12345678', 'qwerty', 'abc123', 'letmein', 'admin', 'iloveyou', '111111', '123456789'];

export function analyzePassword(password) {
  if (!password || password.length === 0) {
    return { score: 0, strength: 'NONE', entropy: 0, crackTime: 'Instant', feedback: [{ type: 'error', message: 'Password is empty' }], checks: {}, length: 0, charsetSize: 0 };
  }
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const uniqueChars = new Set(password).size;

  let score = 0;
  if (password.length >= 16) score += 30;
  else if (password.length >= 12) score += 25;
  else if (password.length >= 8) score += 15;
  else if (password.length >= 6) score += 8;
  else score += 3;

  const diversity = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
  score += diversity * 6;
  score += Math.round((uniqueChars / password.length) * 15);

  const charsetSize = getCharsetSize(password);
  const entropy = password.length * Math.log2(charsetSize || 1);
  if (entropy >= 60) score += 15;
  else if (entropy >= 40) score += 10;
  else if (entropy >= 28) score += 5;

  const feedback = [];
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    score = Math.min(score, 10);
    feedback.push({ type: 'error', message: 'This is a commonly breached password — easily guessable' });
  }
  if (password.length < 8) feedback.push({ type: 'error', message: 'Too short — use at least 8 characters (12+ recommended)' });
  if (!hasUpper && hasLower) feedback.push({ type: 'tip', message: 'Add uppercase letters for more strength' });
  if (!hasDigit) feedback.push({ type: 'tip', message: 'Add numbers to increase complexity' });
  if (!hasSpecial) feedback.push({ type: 'tip', message: 'Add special characters (!@#$%^&*) for best security' });

  score = Math.max(0, Math.min(100, score));

  let strength;
  if (score >= 80) strength = 'STRONG';
  else if (score >= 60) strength = 'GOOD';
  else if (score >= 40) strength = 'FAIR';
  else if (score >= 20) strength = 'WEAK';
  else strength = 'VERY_WEAK';

  const guessesPerSecond = 10_000_000_000;
  const combinations = Math.pow(charsetSize, password.length);
  const crackTime = formatCrackTime(combinations / guessesPerSecond / 2);

  return {
    score, strength, entropy: Math.round(entropy * 10) / 10, crackTime, feedback,
    checks: { length: password.length >= 8, lowercase: hasLower, uppercase: hasUpper, numbers: hasDigit, special: hasSpecial, uniqueChars: uniqueChars >= Math.min(6, password.length) },
    length: password.length, charsetSize,
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
  return 'Centuries+';
}

const BREACHED_TOKENS = ['test', 'demo', 'admin', 'john', 'breach', 'pwned', 'hacked', 'leak'];

export function checkBreach(rawInput, type) {
  const input = (rawInput || '').toLowerCase().trim();
  const breachFound = BREACHED_TOKENS.some((t) => input.includes(t));
  const breachList = breachFound
    ? [
        { name: 'Collection #1', domain: 'aggregated', breachDate: '2019-01-07', pwnCount: 772904991, dataClasses: ['Email addresses', 'Passwords'], description: 'A large collection of credential-stuffing lists.' },
        { name: 'LinkedIn', domain: 'linkedin.com', breachDate: '2012-05-05', pwnCount: 164611595, dataClasses: ['Email addresses', 'Passwords'], description: '164M LinkedIn accounts exposed.' },
      ]
    : [];
  return {
    breachFound,
    breachCount: breachFound ? breachList.length : 0,
    breachList,
    privacyNote: 'k-Anonymity: Only 5 hash characters sent. Your credential never leaves this browser (demo mode).',
    apiUsed: false,
    apiError: null,
    remediation: breachFound
      ? ['Change your password immediately on affected services', 'Enable two-factor authentication (2FA) on all accounts', 'Do not reuse passwords across different services', 'Consider using a password manager like Bitwarden or 1Password']
      : [],
    checkedAt: new Date().toISOString(),
    type,
  };
}

const truthy = (v) => v === true || v === 'yes' || v === 'true' || v === 1;

export function analyzeWifi({ ssid = 'DemoNetwork', encryption = 'WPA2', isPublic: isPublicRaw = false, hasPassword: hasPasswordRaw = true } = {}) {
  // The client sends 'yes'/'no' strings for these toggles — normalize to bool.
  const isPublic = truthy(isPublicRaw);
  const hasPassword = truthy(hasPasswordRaw);
  let score = 0;
  const checks = [];
  const recommendations = [];

  switch (encryption) {
    case 'WPA3': score += 40; checks.push({ name: 'Encryption Standard', status: 'pass', detail: 'WPA3 — Latest and most secure encryption' }); break;
    case 'WPA2': score += 30; checks.push({ name: 'Encryption Standard', status: 'pass', detail: 'WPA2 — Strong encryption, widely supported' }); break;
    case 'WPA': score += 15; checks.push({ name: 'Encryption Standard', status: 'warn', detail: 'WPA is outdated' }); recommendations.push('Upgrade your router to WPA2 or WPA3 encryption'); break;
    case 'WEP': score += 5; checks.push({ name: 'Encryption Standard', status: 'fail', detail: 'WEP is broken' }); recommendations.push('URGENT: WEP encryption is broken. Upgrade to WPA2/WPA3 immediately'); break;
    default: score += 0; checks.push({ name: 'Encryption Standard', status: 'fail', detail: 'No encryption — All traffic is visible to anyone nearby' }); recommendations.push('CRITICAL: Never use open networks for banking or sensitive transactions');
  }
  if (!isPublic) { score += 25; checks.push({ name: 'Network Type', status: 'pass', detail: 'Private network' }); }
  else { score += 5; recommendations.push('Avoid accessing banking apps or entering passwords on public networks'); recommendations.push('Use a VPN when connected to public Wi-Fi'); }
  if (hasPassword) { score += 20; checks.push({ name: 'Password Protection', status: 'pass', detail: 'Password protected' }); }
  else { score += 0; recommendations.push('Set a strong password on your Wi-Fi network'); }
  if (isPublic || !hasPassword || encryption === 'Open' || encryption === 'WEP') {
    score = Math.max(score - 10, 0);
    recommendations.push('Be aware of Man-in-the-Middle attacks on this network');
  }
  score = Math.max(0, Math.min(100, score));

  let risk_level = 'LOW';
  if (score < 30) risk_level = 'CRITICAL';
  else if (score < 55) risk_level = 'HIGH';
  else if (score < 75) risk_level = 'MEDIUM';

  return { id: `demo-${score}`, ssid, encryption, trust_score: score, risk_level, checks, recommendations, autoDetected: false, scannedAt: new Date().toISOString() };
}

// Dangerous permission tokens (substring match, case-insensitive).
const DANGEROUS_PERMS = ['SMS', 'CONTACT', 'MICROPHONE', 'RECORD_AUDIO', 'CAMERA', 'LOCATION', 'CALL', 'BOOT'];

export function analyzeApp({ appName = 'Unknown App', permissions = [] } = {}) {
  const dangerCount = permissions.filter((p) => DANGEROUS_PERMS.some((d) => String(p).toUpperCase().includes(d))).length;
  const riskScore = Math.min(95, dangerCount * 22 + (permissions.length ? 8 : 0));
  let riskLevel;
  if (riskScore >= 80) riskLevel = 'CRITICAL';
  else if (riskScore >= 60) riskLevel = 'HIGH';
  else if (riskScore >= 30) riskLevel = 'MEDIUM';
  else riskLevel = 'LOW';
  return {
    id: `demo-app-${riskScore}`,
    appName,
    riskScore,
    riskLevel,
    shapReasons: [
      { feature: 'Permission risk analysis', score: 0.5, direction: dangerCount ? 'danger' : 'safe', description: `${dangerCount} dangerous permission(s) requested` },
    ],
    gnnNote: dangerCount >= 3 ? 'Spyware permission pattern detected' : 'Permission set within expected range',
    dangerousCombinations: dangerCount >= 2 ? ['Multiple sensitive permissions requested together'] : [],
    permissionCount: permissions.length,
    model_used: 'Demo Heuristic',
  };
}

// ---------------------------------------------------------------------------
// Static / stateful demo data
// ---------------------------------------------------------------------------

const DEMO_ALERTS = [
  { _id: 'a1', type: 'CRITICAL', title: 'High-risk app detected', description: 'FreeWallpapers HD flagged at 88/100 risk.', module: 'Malware Scanner', read: false, createdAt: new Date(Date.now() - 3600_000).toISOString() },
  { _id: 'a2', type: 'WARNING', title: 'Suspicious URL flagged', description: 'A phishing URL was blocked with 92% confidence.', module: 'Phishing Scanner', read: false, createdAt: new Date(Date.now() - 7200_000).toISOString() },
  { _id: 'a3', type: 'INFO', title: 'Weekly scan complete', description: 'All modules scanned. Security score stable.', module: 'System', read: true, createdAt: new Date(Date.now() - 86400_000).toISOString() },
];

function securityScore() {
  return {
    score: 78,
    level: 'WARNING',
    breakdown: {
      phishing: { score: 85, weight: '30%' },
      malware: { score: 70, weight: '35%' },
      breach: { score: 80, weight: '25%', breachFound: false },
      wifi: { score: 75, weight: '10%' },
    },
    history: Array.from({ length: 7 }, (_, i) => ({ day: `Day ${i + 1}`, score: 72 + ((i * 3) % 12) })),
  };
}

function dashboardStats() {
  return {
    totalScans: 42,
    threatsFound: 6,
    breachChecks: 9,
    unreadAlerts: DEMO_ALERTS.filter((a) => !a.read).length,
    lastScanTime: new Date().toISOString(),
    modules: {
      phishing: { lastScan: new Date().toISOString(), status: 'All Clear' },
      malware: { lastScan: new Date().toISOString(), status: 'Scanned' },
      breach: { lastScan: new Date().toISOString(), status: 'No Breaches' },
      wifi: { lastScan: new Date().toISOString(), status: 'Score: 75' },
    },
  };
}

// ---------------------------------------------------------------------------
// Router — maps {url, method, body} to a server-shaped response envelope
// ---------------------------------------------------------------------------

const ok = (data) => ({ data: { success: true, data } });
const okMsg = (message) => ({ data: { success: true, message } });

export function handleDemoRequest(args) {
  // args may be a string (GET url) or an object { url, method, body }
  const url = (typeof args === 'string' ? args : args.url) || '';
  const method = (typeof args === 'string' ? 'GET' : args.method || 'GET').toUpperCase();
  const body = typeof args === 'string' ? {} : args.body || {};
  const path = url.split('?')[0];

  // Dashboard
  if (path === '/dashboard/score') return ok(securityScore());
  if (path === '/dashboard/stats') return ok(dashboardStats());
  if (path === '/health') return { data: { success: true, message: 'Demo mode — no backend', version: '2.0.0-demo', mongoConnected: false, mlServiceAvailable: false, timestamp: new Date().toISOString() } };
  if (path === '/scans/all' && method === 'DELETE') return okMsg('All scan history cleared (demo)');

  // Phishing
  if (path === '/phishing/scan' && method === 'POST') return ok(classifyPhishing(body.input));
  if (path === '/phishing/history') return method === 'DELETE' ? okMsg('Cleared') : ok([]);

  // Password
  if (path === '/password/check' && method === 'POST') return ok(analyzePassword(body.password));

  // Breach
  if (path === '/breach/check' && method === 'POST') return ok(checkBreach(body.input, body.type));
  if (path === '/breach/history') return method === 'DELETE' ? okMsg('Cleared') : ok([]);

  // WiFi
  if (path === '/wifi/analyze' && method === 'POST') return ok(analyzeWifi(body));
  if (path === '/wifi/auto-scan' && method === 'POST') return ok({ ...analyzeWifi({ ssid: 'Auto-Detected-WiFi', encryption: 'WPA2', isPublic: false, hasPassword: true }), autoDetected: true });
  if (path === '/wifi/history') return method === 'DELETE' ? okMsg('Cleared') : ok([]);

  // Malware
  if (path === '/malware/scan' && method === 'POST') return ok({ riskLevel: 'MEDIUM', riskScore: 45, appsScanned: 24, threatsFound: 2, apps: [] });
  if (path === '/malware/apps') return ok([]);
  if (path === '/malware/analyze' && method === 'POST') return ok(analyzeApp(body));
  if (path === '/malware/history') return method === 'DELETE' ? okMsg('Cleared') : ok([]);

  // Alerts
  if (path === '/alerts' && method === 'GET') return ok(DEMO_ALERTS);
  if (path.startsWith('/alerts') && (method === 'PATCH' || method === 'DELETE')) return okMsg('Updated (demo)');

  // Unknown route — return empty success so the UI never hard-crashes
  return ok(null);
}
