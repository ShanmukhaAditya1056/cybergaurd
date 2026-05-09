import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, Shield, Search, CheckCircle, XCircle, AlertTriangle, Clock, Info } from 'lucide-react';
import { analyzeWifi, getWifiHistory } from '../api/wifiApi';
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
  const queryClient = useQueryClient();

  const { data: historyData } = useQuery({
    queryKey: ['wifiHistory'],
    queryFn: getWifiHistory,
  });

  const analyzeMutation = useMutation({
    mutationFn: (data) => analyzeWifi(data),
    onSuccess: (data) => {
      setWifiResult(data.data);
      queryClient.invalidateQueries(['wifiHistory']);
      queryClient.invalidateQueries(['securityScore']);
      queryClient.invalidateQueries(['navbarScore']);
      const score = data.data.trust_score;
      if (score >= 70) toast.success(`✅ Network score: ${score}/100 — Safe`);
      else if (score >= 40) toast('⚠️ Network score: ' + score + '/100 — Warning', { icon: '⚠️' });
      else toast.error(`🚨 Network score: ${score}/100 — Critical Risk`);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Analysis failed');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ssid.trim()) {
      toast.error('Please enter a network name (SSID)');
      return;
    }
    analyzeMutation.mutate({
      ssid,
      encryption,
      isPublic: isPublic ? 'yes' : 'no',
      hasPassword: hasPassword ? 'yes' : 'no'
    });
  };

  const history = historyData?.data ?? [];

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

        {/* Limitation Notice */}
        <div className="glass-card p-4 mb-6 border-l-4 border-l-blue-accent">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-accent flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-text-white mb-1">ℹ️ Browser Limitation</h3>
              <p className="text-text-dim text-xs">
                Web browsers cannot access Wi-Fi hardware directly. Instead, manually enter your network details below 
                for a comprehensive security analysis based on your configuration.
              </p>
            </div>
          </div>
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
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isPublic ? 'bg-warn' : 'bg-navy-border'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    isPublic ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-navy border border-navy-border">
                <span className="text-sm text-text-muted">Requires Password?</span>
                <button
                  type="button"
                  onClick={() => setHasPassword(!hasPassword)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    hasPassword ? 'bg-safe' : 'bg-navy-border'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    hasPassword ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={analyzeMutation.isPending}
              className="w-full bg-blue-accent hover:bg-blue-600 text-white font-semibold rounded-lg px-6 py-3 transition-all duration-300 btn-glow flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze Network'}
            </button>
          </form>
        </div>

        {/* Loading */}
        {analyzeMutation.isPending && <LoadingSpinner text="Analyzing network security..." />}

        {/* WiFi Result */}
        <AnimatePresence mode="wait">
          {wifiResult && !analyzeMutation.isPending && (
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
                    </div>
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
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-text-dim" />
            <h3 className="text-lg font-semibold text-text-white">Recent Scans</h3>
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
