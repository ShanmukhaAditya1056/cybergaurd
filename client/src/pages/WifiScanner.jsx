import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, Shield, Search, CheckCircle, XCircle, AlertTriangle, Clock, Info, Radar, Signal, Lock, Trash2 } from 'lucide-react';
import { useAnalyzeWifiMutation, useAutoScanWifiMutation, useGetWifiHistoryQuery, useClearWifiHistoryMutation } from '../store/api/apiSlice';
import { isPermissionGranted } from '../utils/permissionUtils';
import ScoreRing from '../components/ScoreRing';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20 }
};

const WifiScanner = () => {
  const [ssid, setSsid] = useState('');
  const [encryption, setEncryption] = useState('WPA2');
  const [isPublic, setIsPublic] = useState(false);
  const [hasPassword, setHasPassword] = useState(true);
  const [wifiResult, setWifiResult] = useState(null);

  const { data: historyData } = useGetWifiHistoryQuery();

  const [triggerAnalyze, { isLoading: isAnalyzing }] = useAnalyzeWifiMutation();
  const [triggerAutoScan, { isLoading: isAutoScanning }] = useAutoScanWifiMutation();
  const [triggerClearHistory] = useClearWifiHistoryMutation();

  const handleClearHistory = () => {
    toast((t) => (
      <div className="flex flex-col gap-3 max-w-sm">
        <p className="text-sm font-medium" style={{ color: '#1C1C1C' }}>🗑️ Delete all WiFi scan history?</p>
        <p className="text-xs" style={{ color: '#5C5C5C' }}>This action cannot be undone.</p>
        <div className="flex gap-2 justify-end mt-1">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all" style={{ border: '1px solid #E6E6E6', color: '#5C5C5C' }}>Cancel</button>
          <button onClick={async () => { toast.dismiss(t.id); try { await triggerClearHistory().unwrap(); toast.success('🧹 WiFi history cleared successfully'); } catch { toast.error('Failed to clear WiFi history'); } }} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all">Yes, Delete</button>
        </div>
      </div>
    ), { duration: 6000, position: 'top-center' });
  };

  // Check WiFi scan permission
  const [wifiPermission, setWifiPermission] = useState(() => isPermissionGranted('wifiScan'));

  useEffect(() => {
    const handlePermChange = () => setWifiPermission(isPermissionGranted('wifiScan'));
    window.addEventListener('cyberguard-permissions-changed', handlePermChange);
    window.addEventListener('storage', handlePermChange);
    return () => {
      window.removeEventListener('cyberguard-permissions-changed', handlePermChange);
      window.removeEventListener('storage', handlePermChange);
    };
  }, []);

  const handleAutoScan = async () => {
    if (!wifiPermission) {
      toast.error('WiFi scanning permission denied. Enable it in Settings.');
      return;
    }
    try {
      const data = await triggerAutoScan({ wifiPermission: true }).unwrap();
      setWifiResult(data);
      if (data.ssid) setSsid(data.ssid);
      if (data.encryption) setEncryption(data.encryption);
      const score = data.trust_score;
      if (score >= 70) toast.success(`✅ Auto-detected: ${data.ssid} — Score: ${score}/100`);
      else if (score >= 40) toast(`⚠️ Auto-detected: ${data.ssid} — Score: ${score}/100`, { icon: '⚠️' });
      else toast.error(`🚨 Auto-detected: ${data.ssid} — Score: ${score}/100`);
    } catch (error) {
      toast.error(error?.data?.message || 'Could not auto-detect WiFi. Try manual input below.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ssid.trim()) {
      toast.error('Please enter a network name (SSID)');
      return;
    }
    try {
      const data = await triggerAnalyze({
        ssid,
        encryption,
        isPublic: isPublic ? 'yes' : 'no',
        hasPassword: hasPassword ? 'yes' : 'no'
      }).unwrap();
      setWifiResult(data);
      const score = data.trust_score;
      if (score >= 70) toast.success(`✅ Network score: ${score}/100 — Safe`);
      else if (score >= 40) toast('⚠️ Network score: ' + score + '/100 — Warning', { icon: '⚠️' });
      else toast.error(`🚨 Network score: ${score}/100 — Critical Risk`);
    } catch (error) {
      toast.error(error?.data?.message || 'Analysis failed');
    }
  };

  const history = historyData ?? [];

  const getCheckIcon = (status) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-safe" />;
      case 'fail': return <XCircle className="w-4 h-4 text-danger" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warn" />;
      default: return <Info className="w-4 h-4 text-text-dim" />;
    }
  };

  const getCheckBorder = (status) => {
    switch (status) {
      case 'pass': return 'border-safe/20 bg-safe-bg/30';
      case 'fail': return 'border-danger/20 bg-danger-bg/30';
      case 'warning': return 'border-warn/20 bg-warn-bg/30';
      default: return 'border-navy-border bg-navy/50';
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-navy pt-20 pb-10 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-safe/10 border border-safe/30">
            <Wifi className="w-6 h-6 text-safe" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-white">Wi-Fi Scanner</h1>
            <p className="text-text-muted text-sm">Network Security Analyzer</p>
          </div>
        </div>

        {/* Auto-Detect Button */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Radar className="w-5 h-5 text-blue-accent" />
            <div>
              <h3 className="text-sm font-semibold text-text-white">Auto-Detect Network</h3>
              <p className="text-text-dim text-xs">Automatically reads your connected WiFi network details</p>
            </div>
          </div>
          <button
            onClick={() => handleAutoScan()}
            disabled={isAutoScanning || !wifiPermission}
            className={`w-full font-semibold rounded-lg px-6 py-3.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 ${
              wifiPermission
                ? 'bg-blue-accent hover:bg-blue-600 text-white btn-glow'
                : 'bg-navy-border text-text-dim cursor-not-allowed'
            }`}
          >
            {!wifiPermission ? (
              <>
                <Lock className="w-4 h-4" />
                WiFi Scan Permission Denied
              </>
            ) : isAutoScanning ? (
              <>
                <Wifi className="w-4 h-4 animate-pulse" />
                Detecting WiFi Network...
              </>
            ) : (
              <>
                <Signal className="w-4 h-4" />
                Scan Connected WiFi
              </>
            )}
          </button>
          {!wifiPermission && (
            <p className="text-xs text-warn mt-2 text-center">
              🔒 WiFi scanning permission was denied. Go to{' '}
              <a href="/settings" className="text-blue-accent underline hover:text-blue-400">Settings</a>{' '}
              to enable it.
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-navy-border" />
          <span className="text-text-dim text-xs">OR ENTER MANUALLY</span>
          <div className="flex-1 h-px bg-navy-border" />
        </div>

        {/* Network Analysis Form */}
        <div className="glass-card p-6 mb-6">
          <h3 className="text-lg font-semibold text-text-white mb-4">Network Details</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* SSID */}
            <div>
              <label className="block text-sm text-text-muted mb-1">Network Name (SSID)</label>
              <input
                type="text"
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
                placeholder="e.g., HomeWiFi, CafePublic, Airport_Free"
                className="w-full bg-navy border border-navy-border rounded-lg text-text-white placeholder-text-dim px-4 py-3 text-sm"
              />
            </div>

            {/* Encryption */}
            <div>
              <label className="block text-sm text-text-muted mb-1">Encryption Type</label>
              <select
                value={encryption}
                onChange={(e) => setEncryption(e.target.value)}
                className="w-full bg-navy border border-navy-border rounded-lg text-text-white px-4 py-3 text-sm appearance-none cursor-pointer"
              >
                <option value="WPA3">WPA3 (Latest & Most Secure)</option>
                <option value="WPA2">WPA2 (Strong)</option>
                <option value="WPA">WPA (Outdated)</option>
                <option value="WEP">WEP (Weak — Easily Cracked)</option>
                <option value="Open">Open (No Encryption)</option>
              </select>
            </div>

            {/* Toggle Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-navy border border-navy-border">
                <span className="text-sm text-text-muted">Public Network?</span>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`inline-flex items-center flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                    isPublic ? 'bg-warn' : 'bg-navy-border'
                  }`}
                >
                  <span className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    isPublic ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-navy border border-navy-border">
                <span className="text-sm text-text-muted">Requires Password?</span>
                <button
                  type="button"
                  onClick={() => setHasPassword(!hasPassword)}
                  className={`inline-flex items-center flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                    hasPassword ? 'bg-safe' : 'bg-navy-border'
                  }`}
                >
                  <span className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    hasPassword ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAnalyzing}
              className="w-full bg-blue-accent hover:bg-blue-600 text-white font-semibold rounded-lg px-6 py-3 transition-all duration-300 btn-glow flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              {isAnalyzing ? 'Analyzing...' : 'Analyze Network'}
            </button>
          </form>
        </div>

        {/* Loading */}
        {isAnalyzing && <LoadingSpinner text="Analyzing network security..." />}

        {/* WiFi Result */}
        <AnimatePresence mode="wait">
          {wifiResult && !isAnalyzing && (
            <motion.div
              key="wifi-result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 mb-8"
            >
              {/* Trust Score Card */}
              <div className="glass-card p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <ScoreRing score={wifiResult.trust_score} size={120} strokeWidth={8} />
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-xl font-bold text-text-white mb-1">{wifiResult.ssid}</h2>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                      <RiskBadge risk={wifiResult.risk_level} size="md" />
                      <span className="text-text-muted text-sm">Trust Score: {wifiResult.trust_score}/100</span>
                      {wifiResult.autoDetected && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-accent/10 text-blue-accent border border-blue-accent/20">
                          Auto-Detected
                        </span>
                      )}
                    </div>
                    {/* Extra network details from auto-detect */}
                    {wifiResult.signal && (
                      <div className="flex flex-wrap gap-3 mt-2">
                        <span className="text-xs text-text-dim">Signal: {wifiResult.signal}%</span>
                        {wifiResult.channel && <span className="text-xs text-text-dim">Channel: {wifiResult.channel}</span>}
                        {wifiResult.band && <span className="text-xs text-text-dim">Band: {wifiResult.band}</span>}
                        {wifiResult.radioType && <span className="text-xs text-text-dim">Radio: {wifiResult.radioType}</span>}
                        {wifiResult.authentication && <span className="text-xs text-text-dim">Auth: {wifiResult.authentication}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Security Checks */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-accent" />
                  Security Checks
                </h3>
                <div className="space-y-2">
                  {wifiResult.checks.map((check, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${getCheckBorder(check.status)}`}
                    >
                      <div className="mt-0.5">{getCheckIcon(check.status)}</div>
                      <div>
                        <p className="text-text-white text-sm font-medium">{check.name}</p>
                        <p className="text-text-dim text-xs">{check.detail}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {wifiResult.recommendations && wifiResult.recommendations.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-text-white mb-4">📋 Recommendations</h3>
                  <div className="space-y-2">
                    {wifiResult.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-navy/50">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-accent/20 text-blue-accent text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <p className="text-text-muted text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scan History */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-text-dim" />
              <h3 className="text-lg font-semibold text-text-white">Recent Scans</h3>
            </div>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                title="Clear WiFi history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>

          {history.length > 0 ? (
            <div className="space-y-2">
              {history.map((scan) => (
                <div key={scan._id} className="flex items-center justify-between p-3 rounded-lg border border-navy-border bg-navy/30">
                  <div className="flex items-center gap-3">
                    <Wifi className={`w-4 h-4 ${
                      scan.score >= 70 ? 'text-safe' : scan.score >= 40 ? 'text-warn' : 'text-danger'
                    }`} />
                    <div>
                      <p className="text-text-white text-sm">{scan.input}</p>
                      <p className="text-text-dim text-xs">
                        {scan.details?.encryption} • {new Date(scan.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${
                      scan.score >= 70 ? 'text-safe' : scan.score >= 40 ? 'text-warn' : 'text-danger'
                    }`}>
                      {scan.score}/100
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wifi className="w-10 h-10 text-text-dim mx-auto mb-3" />
              <p className="text-text-muted">No scans yet. Analyze your network above!</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default WifiScanner;
