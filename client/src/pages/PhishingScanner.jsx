import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, Search, ShieldAlert, Clock, CheckCircle, XCircle } from 'lucide-react';
import { scanPhishing, getPhishingHistory } from '../api/phishingApi';
import ShapBar from '../components/ShapBar';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20 }
};

const PhishingScanner = () => {
  const [inputValue, setInputValue] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const queryClient = useQueryClient();

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['phishingHistory'],
    queryFn: getPhishingHistory,
  });

  const scanMutation = useMutation({
    mutationFn: (input) => scanPhishing(input),
    onSuccess: (data) => {
      setScanResult(data.data);
      queryClient.invalidateQueries(['phishingHistory']);
      queryClient.invalidateQueries(['securityScore']);
      queryClient.invalidateQueries(['navbarScore']);
      if (data.data.verdict === 'PHISHING') {
        toast.error('⚠️ Phishing detected!');
      } else {
        toast.success('✅ URL appears safe');
      }
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Scan failed');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      toast.error('Please enter a URL or message to scan');
      return;
    }
    scanMutation.mutate(inputValue);
  };

  const history = historyData?.data ?? [];

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
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-blue-accent/10 border border-blue-accent/30">
              <Link className="w-6 h-6 text-blue-accent" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-white">Phishing Scanner</h1>
              <p className="text-text-muted text-sm">Powered by DistilBERT NLP Analysis</p>
            </div>
          </div>
        </div>

        {/* Scanner Input */}
        <div className="glass-card p-6 mb-6">
          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Paste a URL or WhatsApp/SMS message to scan
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="e.g., https://verify-now-sbi.xyz/login or a suspicious message..."
                className="flex-1 bg-navy border border-navy-border rounded-lg text-text-white placeholder-text-dim px-4 py-3 text-sm focus:border-blue-accent transition-colors"
              />
              <button
                type="submit"
                disabled={scanMutation.isPending}
                className="bg-blue-accent hover:bg-blue-600 text-white font-semibold rounded-lg px-6 py-3 transition-all duration-300 btn-glow flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                {scanMutation.isPending ? 'Scanning...' : 'Scan Now'}
              </button>
            </div>
          </form>
        </div>

        {/* Loading State */}
        {scanMutation.isPending && (
          <LoadingSpinner text="Analyzing URL with AI..." />
        )}

        {/* Scan Result */}
        <AnimatePresence mode="wait">
          {scanResult && !scanMutation.isPending && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 mb-8"
            >
              {/* Verdict Card */}
              <div className={`glass-card p-6 border-l-4 ${
                scanResult.verdict === 'PHISHING'
                  ? 'border-l-danger gradient-danger'
                  : 'border-l-safe gradient-safe'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {scanResult.verdict === 'PHISHING' ? (
                      <ShieldAlert className="w-8 h-8 text-danger" />
                    ) : (
                      <CheckCircle className="w-8 h-8 text-safe" />
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-text-white">
                        {scanResult.verdict === 'PHISHING' ? '⚠️ Phishing Detected' : '✅ URL is Safe'}
                      </h2>
                      <p className="text-text-muted text-sm">{scanResult.domain}</p>
                    </div>
                  </div>
                  <RiskBadge risk={scanResult.verdict === 'PHISHING' ? scanResult.threat_level : 'SAFE'} size="lg" />
                </div>

                {/* Confidence */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-text-muted">Confidence</span>
                    <span className={`text-sm font-bold ${
                      scanResult.verdict === 'PHISHING' ? 'text-danger' : 'text-safe'
                    }`}>
                      {scanResult.confidence}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-navy">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${scanResult.confidence}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        scanResult.verdict === 'PHISHING' ? 'bg-danger' : 'bg-safe'
                      }`}
                    />
                  </div>
                </div>

                {/* URL Info */}
                <div className="text-xs text-text-dim bg-navy/50 rounded-lg p-3 break-all">
                  <span className="text-text-muted font-medium">Scanned URL: </span>
                  {scanResult.url}
                </div>
              </div>

              {/* SHAP Explanation */}
              {scanResult.shap_reasons && scanResult.shap_reasons.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-text-white mb-1">
                    AI Explanation (SHAP Analysis)
                  </h3>
                  <p className="text-text-dim text-xs mb-4">
                    Feature contribution to the verdict — higher bars indicate stronger influence
                  </p>
                  <div className="space-y-4">
                    {scanResult.shap_reasons.map((reason, index) => (
                      <ShapBar
                        key={index}
                        feature={reason.feature}
                        score={reason.score}
                        direction={reason.direction}
                        description={reason.description}
                        index={index}
                      />
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
            <h3 className="text-lg font-semibold text-text-white">Scan History</h3>
          </div>

          {historyLoading ? (
            <LoadingSpinner text="Loading history..." />
          ) : history.length > 0 ? (
            <div className="space-y-3">
              {history.map((scan) => (
                <motion.div
                  key={scan._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    scan.verdict === 'PHISHING'
                      ? 'border-danger/20 bg-danger-bg/30'
                      : 'border-safe/20 bg-safe-bg/30'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {scan.verdict === 'PHISHING' ? (
                      <XCircle className="w-4 h-4 text-danger flex-shrink-0" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-safe flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-text-white text-sm truncate">{scan.input}</p>
                      <p className="text-text-dim text-xs">
                        {new Date(scan.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className={`text-xs font-bold ${
                      scan.verdict === 'PHISHING' ? 'text-danger' : 'text-safe'
                    }`}>
                      {scan.confidence}%
                    </span>
                    <RiskBadge risk={scan.verdict} size="sm" />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="w-10 h-10 text-text-dim mx-auto mb-3" />
              <p className="text-text-muted">No scans yet. Try scanning a URL above!</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PhishingScanner;
