const ScanResult = require('../models/ScanResult');
const Alert = require('../models/Alert');
const { scanWifi } = require('../utils/deviceScanner');

/**
 * Calculate WiFi trust score based on network parameters
 */
const calculateTrustScore = (encryption, isPublic, hasPassword) => {
  let score = 0;
  const checks = [];
  const recommendations = [];

  // Encryption check
  switch (encryption) {
    case 'WPA3':
      score += 40;
      checks.push({ name: 'Encryption Standard', status: 'pass', detail: 'WPA3 — Latest and most secure encryption' });
      break;
    case 'WPA2':
      score += 30;
      checks.push({ name: 'Encryption Standard', status: 'pass', detail: 'WPA2 — Strong encryption, widely supported' });
      break;
    case 'WPA':
      score += 15;
      checks.push({ name: 'Encryption Standard', status: 'warning', detail: 'WPA — Outdated, upgrade to WPA2/WPA3 recommended' });
      recommendations.push('Upgrade your router to WPA2 or WPA3 encryption');
      break;
    case 'WEP':
      score += 5;
      checks.push({ name: 'Encryption Standard', status: 'fail', detail: 'WEP — Critically weak, can be cracked in minutes' });
      recommendations.push('URGENT: WEP encryption is broken. Upgrade to WPA2/WPA3 immediately');
      break;
    case 'Open':
    default:
      score += 0;
      checks.push({ name: 'Encryption Standard', status: 'fail', detail: 'No encryption — All traffic is visible to anyone nearby' });
      recommendations.push('CRITICAL: Never use open networks for banking or sensitive transactions');
      break;
  }

  // Public network check
  if (!isPublic) {
    score += 25;
    checks.push({ name: 'Network Privacy', status: 'pass', detail: 'Private network — Limited access, lower risk' });
  } else {
    score += 5;
    checks.push({ name: 'Network Privacy', status: 'fail', detail: 'Public network — Higher risk of interception' });
    recommendations.push('Avoid accessing banking apps or entering passwords on public networks');
    recommendations.push('Use a VPN when connected to public Wi-Fi');
  }

  // Password check
  if (hasPassword) {
    score += 20;
    checks.push({ name: 'Password Protection', status: 'pass', detail: 'Network is password protected' });
  } else {
    score += 0;
    checks.push({ name: 'Password Protection', status: 'fail', detail: 'No password — Anyone can connect and sniff traffic' });
    recommendations.push('Set a strong password on your Wi-Fi network');
  }

  // MITM risk assessment
  if (isPublic || !hasPassword || encryption === 'Open' || encryption === 'WEP') {
    score = Math.max(score - 10, 0);
    checks.push({ name: 'Man-in-the-Middle (MITM)', status: 'fail', detail: 'HIGH risk — Attackers can intercept your traffic' });
    recommendations.push('Be aware of Man-in-the-Middle attacks on this network');
  } else {
    checks.push({ name: 'Man-in-the-Middle (MITM)', status: 'pass', detail: 'LOW risk — Encryption provides protection' });
  }

  // DNS spoofing risk
  if (isPublic) {
    checks.push({ name: 'DNS Spoofing', status: 'warning', detail: 'MODERATE risk — Public networks can redirect your traffic' });
    recommendations.push('Consider using DNS-over-HTTPS (DoH) or changing DNS to 1.1.1.1 or 8.8.8.8');
  } else {
    checks.push({ name: 'DNS Spoofing', status: 'pass', detail: 'LOW risk — Private network with trusted DNS' });
  }

  // Evil twin risk
  if (isPublic) {
    checks.push({ name: 'Evil Twin Attack', status: 'warning', detail: 'MODERATE risk — Fake hotspots can mimic this network name' });
    recommendations.push('Verify the network name with the venue staff before connecting');
  } else {
    checks.push({ name: 'Evil Twin Attack', status: 'pass', detail: 'LOW risk — Private network is harder to impersonate' });
  }

  // Ensure score is within bounds and matches the specified ranges
  score = Math.max(0, Math.min(100, score));

  // Adjust to match specification ranges
  if (encryption === 'WPA3' && !isPublic && hasPassword) {
    score = Math.max(90, Math.min(100, score));
  } else if (encryption === 'WPA2' && !isPublic && hasPassword) {
    score = Math.max(75, Math.min(89, score));
  } else if (encryption === 'WPA2' && isPublic) {
    score = Math.max(50, Math.min(65, score));
  } else if (encryption === 'WPA') {
    score = Math.max(35, Math.min(50, score));
  } else if (encryption === 'WEP') {
    score = Math.max(15, Math.min(30, score));
  } else if (encryption === 'Open' || !hasPassword) {
    score = Math.max(5, Math.min(15, score));
  }

  // Determine risk level
  let riskLevel;
  if (score >= 75) riskLevel = 'LOW';
  else if (score >= 50) riskLevel = 'MEDIUM';
  else if (score >= 25) riskLevel = 'HIGH';
  else riskLevel = 'CRITICAL';

  if (recommendations.length === 0) {
    recommendations.push('Your network configuration looks good! Keep your router firmware updated.');
  }

  return {
    trust_score: score,
    risk_level: riskLevel,
    checks,
    recommendations
  };
};

/**
 * POST /api/wifi/analyze
 * Analyze WiFi network security based on user input
 */
const analyzeWifi = async (req, res) => {
  try {
    const { ssid, encryption, isPublic, hasPassword } = req.body;

    if (!ssid || !encryption) {
      return res.status(400).json({
        success: false,
        message: 'Please provide network name (SSID) and encryption type'
      });
    }

    const result = calculateTrustScore(encryption, isPublic === true || isPublic === 'yes', hasPassword === true || hasPassword === 'yes');

    // Save scan result
    const scanResult = await ScanResult.create({
      type: 'wifi',
      input: ssid,
      verdict: result.risk_level,
      score: result.trust_score,
      confidence: 90,
      details: {
        ssid,
        encryption,
        isPublic,
        hasPassword,
        checks: result.checks,
        recommendations: result.recommendations,
        risk_level: result.risk_level
      }
    });

    // Create alert for risky networks
    if (result.risk_level === 'HIGH' || result.risk_level === 'CRITICAL') {
      await Alert.create({
        type: result.risk_level === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        title: `Insecure Wi-Fi Network: ${ssid}`,
        description: `Network "${ssid}" scored ${result.trust_score}/100 (${result.risk_level} risk). ${result.recommendations[0]}`,
        module: 'WiFi Scanner'
      });
    }

    res.json({
      success: true,
      data: {
        id: scanResult._id,
        ssid,
        trust_score: result.trust_score,
        risk_level: result.risk_level,
        checks: result.checks,
        recommendations: result.recommendations,
        scannedAt: scanResult.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/wifi/history
 * Get WiFi scan history
 */
const getWifiHistory = async (req, res) => {
  try {
    const history = await ScanResult.find({ type: 'wifi' })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('input verdict score details createdAt');

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/wifi/auto-scan
 * Auto-detect WiFi network from the system and analyze
 */
const autoScanWifi = async (req, res) => {
  try {
    const wifiInfo = await scanWifi();

    if (!wifiInfo.available) {
      return res.status(400).json({
        success: false,
        message: wifiInfo.error || 'Could not detect WiFi network. Make sure WiFi is connected.',
      });
    }

    // Run trust score calculation on real data
    const result = calculateTrustScore(
      wifiInfo.encryption,
      wifiInfo.isPublic,
      wifiInfo.hasPassword
    );

    // Save scan result
    const scanResult = await ScanResult.create({
      type: 'wifi',
      input: wifiInfo.ssid,
      verdict: result.risk_level,
      score: result.trust_score,
      confidence: 95,
      details: {
        ssid: wifiInfo.ssid,
        encryption: wifiInfo.encryption,
        authentication: wifiInfo.authentication,
        cipher: wifiInfo.cipher,
        signal: wifiInfo.signal,
        radioType: wifiInfo.radioType,
        channel: wifiInfo.channel,
        bssid: wifiInfo.bssid,
        band: wifiInfo.band,
        isPublic: wifiInfo.isPublic,
        hasPassword: wifiInfo.hasPassword,
        checks: result.checks,
        recommendations: result.recommendations,
        risk_level: result.risk_level,
        autoDetected: true,
      },
    });

    // Create alert for risky networks
    if (result.risk_level === 'HIGH' || result.risk_level === 'CRITICAL') {
      await Alert.create({
        type: result.risk_level === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        title: `Insecure Wi-Fi Network: ${wifiInfo.ssid}`,
        description: `Network "${wifiInfo.ssid}" scored ${result.trust_score}/100 (${result.risk_level} risk). ${result.recommendations[0]}`,
        module: 'WiFi Scanner',
      });
    }

    res.json({
      success: true,
      data: {
        id: scanResult._id,
        ssid: wifiInfo.ssid,
        encryption: wifiInfo.encryption,
        authentication: wifiInfo.authentication,
        cipher: wifiInfo.cipher,
        signal: wifiInfo.signal,
        radioType: wifiInfo.radioType,
        channel: wifiInfo.channel,
        bssid: wifiInfo.bssid,
        band: wifiInfo.band,
        trust_score: result.trust_score,
        risk_level: result.risk_level,
        checks: result.checks,
        recommendations: result.recommendations,
        autoDetected: true,
        scannedAt: scanResult.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  analyzeWifi,
  getWifiHistory,
  autoScanWifi,
};
