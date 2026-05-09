/**
 * CyberGuard AI -- Desktop WiFi Scanner Agent
 * Reads REAL WiFi network data from Windows and sends it to the CyberGuard API
 * 
 * Usage: node scanner.js
 */
const { exec } = require('child_process');
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

/**
 * Parse Windows 'netsh wlan show interfaces' output
 */
function parseWifiInfo(stdout) {
  const lines = stdout.split('\n');
  const info = {};
  
  for (const line of lines) {
    const match = line.match(/^\s+(.+?)\s+:\s+(.+)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      
      switch (key) {
        case 'SSID':
          info.ssid = value;
          break;
        case 'Authentication':
          info.authentication = value;
          break;
        case 'Cipher':
          info.cipher = value;
          break;
        case 'Signal':
          info.signal = parseInt(value.replace('%', ''));
          break;
        case 'Radio type':
          info.radioType = value;
          break;
        case 'Channel':
          info.channel = parseInt(value);
          break;
        case 'BSSID':
          info.bssid = value;
          break;
        case 'Network type':
          info.networkType = value;
          break;
        case 'State':
          info.state = value;
          break;
        case 'Band':
          info.band = value;
          break;
      }
    }
  }
  
  return info;
}

/**
 * Map Windows auth type to CyberGuard encryption format
 */
function mapEncryption(authType) {
  if (!authType) return 'Open';
  const auth = authType.toLowerCase();
  if (auth.includes('wpa3')) return 'WPA3';
  if (auth.includes('wpa2')) return 'WPA2';
  if (auth.includes('wpa')) return 'WPA';
  if (auth.includes('wep')) return 'WEP';
  return 'Open';
}

/**
 * Get real WiFi information from the system
 */
function getWifiInfo() {
  return new Promise((resolve, reject) => {
    exec('netsh wlan show interfaces', (err, stdout, stderr) => {
      if (err) {
        reject(new Error('Failed to read WiFi info. Make sure WiFi is connected.'));
        return;
      }
      
      const info = parseWifiInfo(stdout);
      
      if (!info.ssid) {
        reject(new Error('No WiFi network connected.'));
        return;
      }
      
      resolve(info);
    });
  });
}

/**
 * Send WiFi data to CyberGuard API for analysis
 */
async function analyzeWifi(wifiInfo) {
  const encryption = mapEncryption(wifiInfo.authentication);
  
  const payload = {
    ssid: wifiInfo.ssid,
    encryption: encryption,
    isPublic: 'no',
    hasPassword: encryption !== 'Open' ? 'yes' : 'no'
  };
  
  console.log('\n  Sending to CyberGuard API...');
  
  const response = await axios.post(`${API_URL}/wifi/analyze`, payload);
  return response.data;
}

/**
 * Display results
 */
function displayResults(wifiInfo, apiResult) {
  const data = apiResult.data;
  
  console.log('\n' + '='.repeat(50));
  console.log('  WIFI SECURITY ANALYSIS RESULTS');
  console.log('='.repeat(50));
  
  console.log('\n  [NETWORK INFO]');
  console.log(`  SSID:           ${wifiInfo.ssid}`);
  console.log(`  Authentication: ${wifiInfo.authentication || 'Unknown'}`);
  console.log(`  Cipher:         ${wifiInfo.cipher || 'Unknown'}`);
  console.log(`  Signal:         ${wifiInfo.signal || 'Unknown'}%`);
  console.log(`  Radio Type:     ${wifiInfo.radioType || 'Unknown'}`);
  console.log(`  Channel:        ${wifiInfo.channel || 'Unknown'}`);
  console.log(`  Band:           ${wifiInfo.band || 'Unknown'}`);
  console.log(`  BSSID:          ${wifiInfo.bssid || 'Unknown'}`);
  
  console.log('\n  [SECURITY SCORE]');
  const score = data.trust_score;
  const level = score >= 70 ? 'SAFE' : score >= 40 ? 'WARNING' : 'CRITICAL';
  console.log(`  Trust Score:    ${score}/100 (${level})`);
  console.log(`  Risk Level:     ${data.risk_level}`);
  
  if (data.checks && data.checks.length > 0) {
    console.log('\n  [SECURITY CHECKS]');
    for (const check of data.checks) {
      const icon = check.status === 'pass' ? '[PASS]' : check.status === 'fail' ? '[FAIL]' : '[WARN]';
      console.log(`  ${icon} ${check.name}: ${check.detail}`);
    }
  }
  
  if (data.recommendations && data.recommendations.length > 0) {
    console.log('\n  [RECOMMENDATIONS]');
    data.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('  Scan saved to CyberGuard dashboard.');
  console.log('  View at: http://localhost:3000/wifi');
  console.log('='.repeat(50) + '\n');
}

/**
 * Main
 */
async function main() {
  console.log('='.repeat(50));
  console.log('  CyberGuard AI -- WiFi Scanner Agent');
  console.log('  Reading real WiFi data from your device...');
  console.log('='.repeat(50));
  
  try {
    // Step 1: Read real WiFi data
    const wifiInfo = await getWifiInfo();
    console.log(`\n  [OK] Connected to: ${wifiInfo.ssid}`);
    console.log(`  [OK] Auth: ${wifiInfo.authentication}, Signal: ${wifiInfo.signal}%`);
    
    // Step 2: Send to API for analysis
    const result = await analyzeWifi(wifiInfo);
    
    if (result.success) {
      displayResults(wifiInfo, result);
    } else {
      console.log('\n  [ERROR] API returned an error:', result.message);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('\n  [ERROR] Cannot connect to CyberGuard API.');
      console.log('  Make sure the server is running: cd server && nodemon');
    } else {
      console.log('\n  [ERROR]', error.message);
    }
  }
}

main();
