const ScanResult = require('../models/ScanResult');
const Alert = require('../models/Alert');
const BreachLog = require('../models/BreachLog');
const { APPS } = require('../utils/malwareAnalyzer');
const {
  calculateUnifiedScore,
  calculatePhishingScore,
  calculateMalwareScore,
  calculateBreachScore,
  calculateWifiScore,
  getScoreLevel
} = require('../utils/scoreCalculator');

/**
 * GET /api/dashboard/score
 * Calculate and return the unified security score
 */
const getSecurityScore = async (req, res) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get phishing scans from last 24h
    const recentPhishing = await ScanResult.find({
      type: 'phishing',
      verdict: 'PHISHING',
      createdAt: { $gte: oneDayAgo }
    });
    const phishingScore = calculatePhishingScore(recentPhishing.length);

    // Get malware scan data from actual scans in DB
    const malwareScans = await ScanResult.find({ type: 'malware' }).sort({ createdAt: -1 }).limit(1);
    let malwareScore;
    if (malwareScans.length > 0 && malwareScans[0].details && malwareScans[0].details.threats) {
      malwareScore = calculateMalwareScore(malwareScans[0].details.threats);
    } else {
      // No malware scan performed yet — default to full score
      malwareScore = 100;
    }

    // Get breach data from actual breach checks in DB
    const breachLogs = await BreachLog.find({ breachFound: true }).sort({ checkedAt: -1 }).limit(1);
    const breachFound = breachLogs.length > 0;
    const breachScore = calculateBreachScore(breachFound);

    // Get WiFi score from actual wifi scans in DB
    const wifiScans = await ScanResult.find({ type: 'wifi' }).sort({ createdAt: -1 }).limit(1);
    let wifiScore;
    if (wifiScans.length > 0) {
      wifiScore = calculateWifiScore(wifiScans[0].score);
    } else {
      // No wifi scan performed yet — default to full score
      wifiScore = 100;
    }

    // Calculate unified score
    const unifiedScore = calculateUnifiedScore(phishingScore, malwareScore, breachScore, wifiScore, breachFound);
    const level = getScoreLevel(unifiedScore);

    // Build real score history from actual scans in the last 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentScans = await ScanResult.find({
      createdAt: { $gte: sevenDaysAgo }
    }).sort({ createdAt: 1 });

    const scoreHistory = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      const dayLabel = dayStart.toLocaleDateString('en-US', { weekday: 'short' });

      // Find scans that occurred on this day
      const dayScans = recentScans.filter(s => {
        const scanDate = new Date(s.createdAt);
        return scanDate >= dayStart && scanDate <= dayEnd;
      });

      let dayScore = null;
      if (dayScans.length > 0) {
        // Calculate that day's score from actual scan data
        const dayPhishing = dayScans.filter(s => s.type === 'phishing' && s.verdict === 'PHISHING').length;
        const dayPhishingScore = calculatePhishingScore(dayPhishing);

        // Use the latest malware/wifi scan up to that day
        const dayMalwareScan = dayScans.filter(s => s.type === 'malware').pop();
        const dayMalwareScore = dayMalwareScan && dayMalwareScan.details && dayMalwareScan.details.threats
          ? calculateMalwareScore(dayMalwareScan.details.threats) : malwareScore;

        const dayWifiScan = dayScans.filter(s => s.type === 'wifi').pop();
        const dayWifiScore = dayWifiScan ? calculateWifiScore(dayWifiScan.score) : wifiScore;

        const dayBreachScan = dayScans.filter(s => s.type === 'breach' && s.verdict === 'BREACH_FOUND').length > 0;
        const dayBreachScore = calculateBreachScore(dayBreachScan);

        dayScore = calculateUnifiedScore(dayPhishingScore, dayMalwareScore, dayBreachScore, dayWifiScore, dayBreachScan);
      }

      scoreHistory.push({
        day: dayLabel,
        date: dayStart.toISOString().split('T')[0],
        score: dayScore // null means no scans that day
      });
    }

    // Set today's score to the current calculated score
    scoreHistory[scoreHistory.length - 1].score = unifiedScore;

    // Fill nulls: carry forward the previous known score, or use current score as baseline
    let lastKnown = unifiedScore;
    for (let i = scoreHistory.length - 1; i >= 0; i--) {
      if (scoreHistory[i].score !== null) {
        lastKnown = scoreHistory[i].score;
      }
    }
    for (let i = 0; i < scoreHistory.length; i++) {
      if (scoreHistory[i].score === null) {
        scoreHistory[i].score = lastKnown;
      } else {
        lastKnown = scoreHistory[i].score;
      }
    }

    res.json({
      success: true,
      data: {
        score: unifiedScore,
        level,
        breakdown: {
          phishing: { score: phishingScore, weight: '30%' },
          malware: { score: malwareScore, weight: '35%' },
          breach: { score: breachScore, weight: '25%', breachFound },
          wifi: { score: wifiScore, weight: '10%' }
        },
        history: scoreHistory
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/dashboard/stats
 * Return overall application statistics
 */
const getStats = async (req, res) => {
  try {
    const totalScans = await ScanResult.countDocuments();
    const threatsFound = await ScanResult.countDocuments({
      $or: [
        { verdict: 'PHISHING' },
        { verdict: { $in: ['CRITICAL', 'HIGH'] } }
      ]
    });
    const lastScan = await ScanResult.findOne().sort({ createdAt: -1 });
    const breachChecks = await BreachLog.countDocuments();
    const alertCount = await Alert.countDocuments({ read: false });

    // Module last scan times
    const lastPhishing = await ScanResult.findOne({ type: 'phishing' }).sort({ createdAt: -1 });
    const lastMalware = await ScanResult.findOne({ type: 'malware' }).sort({ createdAt: -1 });
    const lastBreach = await BreachLog.findOne().sort({ checkedAt: -1 });
    const lastWifi = await ScanResult.findOne({ type: 'wifi' }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        totalScans,
        threatsFound,
        breachChecks,
        unreadAlerts: alertCount,
        lastScanTime: lastScan ? lastScan.createdAt : null,
        modules: {
          phishing: {
            lastScan: lastPhishing ? lastPhishing.createdAt : null,
            status: lastPhishing ? (lastPhishing.verdict === 'PHISHING' ? 'Threat Detected' : 'All Clear') : 'Not Scanned'
          },
          malware: {
            lastScan: lastMalware ? lastMalware.createdAt : null,
            status: lastMalware ? 'Scanned' : 'Not Scanned'
          },
          breach: {
            lastScan: lastBreach ? lastBreach.checkedAt : null,
            status: lastBreach ? (lastBreach.breachFound ? 'Breach Found' : 'No Breaches') : 'Not Checked'
          },
          wifi: {
            lastScan: lastWifi ? lastWifi.createdAt : null,
            status: lastWifi ? `Score: ${lastWifi.score}` : 'Not Scanned'
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSecurityScore,
  getStats
};
