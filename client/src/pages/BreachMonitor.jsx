import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, Phone, Shield, ShieldAlert, AlertTriangle, CheckCircle, Clock, Hash, Trash2 } from 'lucide-react';
import { useCheckBreachMutation, useGetBreachHistoryQuery, useClearBreachHistoryMutation } from '../store/api/apiSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { sanitizeEmail, sanitizePhone } from '../utils/sanitize';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20 }
};

const BreachMonitor = () => {
  const [activeTab, setActiveTab] = useState('email');
  const [inputValue, setInputValue] = useState('');
  const [breachResult, setBreachResult] = useState(null);

  const { data: historyData } = useGetBreachHistoryQuery();

  const [triggerCheck, { isLoading: isChecking }] = useCheckBreachMutation();
  const [triggerClearHistory] = useClearBreachHistoryMutation();

  const handleClearHistory = () => {
    toast((t) => (
      <div className="flex flex-col gap-3 max-w-sm">
        <p className="text-sm font-medium" style={{ color: '#E8F0FA' }}>🗑️ Delete all breach check history?</p>
        <p className="text-xs" style={{ color: '#8BA4C2' }}>This action cannot be undone.</p>
        <div className="flex gap-2 justify-end mt-1">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all" style={{ border: '1px solid #1A3C5E', color: '#8BA4C2' }}>Cancel</button>
          <button onClick={async () => { toast.dismiss(t.id); try { await triggerClearHistory().unwrap(); toast.success('🧹 Breach history cleared successfully'); } catch { toast.error('Failed to clear breach history'); } }} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all">Yes, Delete</button>
        </div>
      </div>
    ), { duration: 6000, position: 'top-center' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      toast.error(`Please enter ${activeTab === 'email' ? 'an email address' : 'a phone number'}`);
      return;
    }
    try {
      // Sanitize input based on type
      let cleanInput = inputValue;
      if (activeTab === 'email') {
        const { value, isValid } = sanitizeEmail(inputValue);
        if (!isValid) {
          toast.error('Please enter a valid email address');
          return;
        }
        cleanInput = value;
      } else {
        const { value, isValid } = sanitizePhone(inputValue);
        if (!isValid) {
          toast.error('Please enter a valid phone number');
          return;
        }
        cleanInput = value;
      }

      const data = await triggerCheck({ input: cleanInput, type: activeTab }).unwrap();
      setBreachResult(data);
      if (!data.apiUsed) {
        toast.error('⚠️ Breach database was unreachable. Please try again later.');
      } else if (data.breachFound) {
        toast.error(`⚠️ Found in ${data.breachCount} breach occurrence${data.breachCount > 1 ? 's' : ''}!`);
      } else {
        toast.success('✅ No breaches found');
      }
    } catch (error) {
      toast.error(error?.data?.message || 'Check failed');
    }
  };

  const history = historyData ?? [];

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
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
          <div className="p-2.5 rounded-xl bg-warn/10 border border-warn/30">
            <Lock className="w-6 h-6 text-warn" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-white">Breach Monitor</h1>
            <p className="text-text-muted text-sm">k-Anonymity Powered Credential Check</p>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="glass-card p-4 mb-6 border-l-4 border-l-blue-accent">
          <div className="flex items-start gap-3">
            <Hash className="w-5 h-5 text-blue-accent flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-text-white mb-1">🔒 k-Anonymity Privacy Protection</h3>
              <p className="text-text-dim text-xs">
                Only 5 hash characters sent to check databases. Your full email/phone never leaves this server. 
                We use SHA-1 hashing and the k-Anonymity model to protect your privacy while checking breach databases.
              </p>
            </div>
          </div>
        </div>

        {/* Input Tabs */}
        <div className="glass-card p-6 mb-6">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setActiveTab('email'); setInputValue(''); setBreachResult(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'email'
                  ? 'bg-blue-accent text-white'
                  : 'text-text-muted hover:text-text-white bg-navy border border-navy-border'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => { setActiveTab('phone'); setInputValue(''); setBreachResult(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'phone'
                  ? 'bg-blue-accent text-white'
                  : 'text-text-muted hover:text-text-white bg-navy border border-navy-border'
              }`}
            >
              <Phone className="w-4 h-4" />
              Phone
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type={activeTab === 'email' ? 'email' : 'tel'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={activeTab === 'email' ? 'Enter your email address...' : 'Enter your phone number (e.g., +919876543210)'}
                className="flex-1 bg-navy border border-navy-border rounded-lg text-text-white placeholder-text-dim px-4 py-3 text-sm focus:border-blue-accent transition-colors"
              />
              <button
                type="submit"
                disabled={isChecking}
                className="bg-blue-accent hover:bg-blue-600 text-white font-semibold rounded-lg px-6 py-3 transition-all duration-300 btn-glow flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
              >
                <Shield className="w-4 h-4" />
                {isChecking ? 'Checking...' : 'Check Breach'}
              </button>
            </div>
          </form>
        </div>

        {/* Loading */}
        {isChecking && <LoadingSpinner text="Checking breach databases..." />}

        {/* Breach Result */}
        <AnimatePresence mode="wait">
          {breachResult && !isChecking && (
            <motion.div
              key="breach-result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 mb-8"
            >
              {/* Verdict */}
              <div className={`glass-card p-6 border-l-4 ${
                breachResult.breachFound
                  ? 'border-l-danger gradient-danger'
                  : 'border-l-safe gradient-safe'
              }`}>
                <div className="flex items-center gap-3">
                  {breachResult.breachFound ? (
                    <ShieldAlert className="w-8 h-8 text-danger" />
                  ) : (
                    <CheckCircle className="w-8 h-8 text-safe" />
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-text-white">
                      {breachResult.breachFound
                        ? `⚠️ Found in ${breachResult.breachCount} Breach${breachResult.breachCount > 1 ? 'es' : ''}`
                        : '✅ No Breaches Found'}
                    </h2>
                    <p className="text-text-muted text-sm">
                      {breachResult.breachFound
                        ? 'Your credentials were found in known data breaches. Take immediate action.'
                        : 'Your credentials were not found in any known data breach databases.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* API Error Notice */}
              {breachResult.apiError && (
                <div className="glass-card p-4 border-l-4 border-l-warn">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warn flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-text-white mb-1">⚠️ API Unavailable</h3>
                      <p className="text-text-dim text-xs">
                        {breachResult.apiError} Results may be incomplete. Please try again later for accurate breach detection.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Breach Cards */}
              {breachResult.breachFound && breachResult.breachList.map((breach, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-text-white">{breach.name}</h3>
                      <p className="text-text-dim text-xs">{breach.domain}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-danger">{formatNumber(breach.pwnCount)} accounts</p>
                      <p className="text-xs text-text-dim">{new Date(breach.breachDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>

                  <p className="text-text-muted text-sm mb-3">{breach.description}</p>

                  {/* Data Classes */}
                  <div className="flex flex-wrap gap-2">
                    {breach.dataClasses.map((dc, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-danger/10 text-danger border border-danger/20">
                        {dc}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}

              {/* Remediation */}
              {breachResult.breachFound && breachResult.remediation && breachResult.remediation.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-safe" />
                    Remediation Steps
                  </h3>
                  <div className="space-y-2">
                    {breachResult.remediation.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-navy/50">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-accent/20 text-blue-accent text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <p className="text-text-muted text-sm">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Check History */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-text-dim" />
              <h3 className="text-lg font-semibold text-text-white">Check History</h3>
            </div>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                title="Clear breach history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>

          {history.length > 0 ? (
            <div className="space-y-2">
              {history.map((log) => (
                <div key={log._id} className={`flex items-center justify-between p-3 rounded-lg border ${
                  log.breachFound
                    ? 'border-danger/20 bg-danger-bg/30'
                    : 'border-safe/20 bg-safe-bg/30'
                }`}>
                  <div className="flex items-center gap-3">
                    {log.breachFound ? (
                      <AlertTriangle className="w-4 h-4 text-danger" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-safe" />
                    )}
                    <div>
                      <p className="text-text-white text-sm">
                        Hash: {log.hashPrefix}*** <span className="text-text-dim">({log.breachCount} breach{log.breachCount !== 1 ? 'es' : ''})</span>
                      </p>
                      <p className="text-text-dim text-xs">
                        {new Date(log.checkedAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${log.breachFound ? 'text-danger' : 'text-safe'}`}>
                    {log.breachFound ? 'EXPOSED' : 'CLEAR'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Lock className="w-10 h-10 text-text-dim mx-auto mb-3" />
              <p className="text-text-muted">No breach checks yet. Enter your email or phone above.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default BreachMonitor;
