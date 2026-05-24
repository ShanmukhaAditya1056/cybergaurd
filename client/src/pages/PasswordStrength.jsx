import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KeyRound, Eye, EyeOff, ShieldCheck, ShieldAlert, ShieldX,
  Check, X, Clock, Zap, Hash, Info, AlertTriangle
} from 'lucide-react';
import { useCheckPasswordStrengthMutation } from '../store/api/apiSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import { sanitizeText } from '../utils/sanitize';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20 }
};

const STRENGTH_CONFIG = {
  STRONG:    { color: 'text-safe',     bg: 'bg-safe',     bgFaded: 'bg-safe/10',     border: 'border-safe/30',     label: 'Strong',    icon: ShieldCheck },
  GOOD:      { color: 'text-blue-accent', bg: 'bg-blue-accent', bgFaded: 'bg-blue-accent/10', border: 'border-blue-accent/30', label: 'Good',      icon: ShieldCheck },
  FAIR:      { color: 'text-warn',     bg: 'bg-warn',     bgFaded: 'bg-warn/10',     border: 'border-warn/30',     label: 'Fair',      icon: ShieldAlert },
  WEAK:      { color: 'text-danger',   bg: 'bg-danger',   bgFaded: 'bg-danger/10',   border: 'border-danger/30',   label: 'Weak',      icon: ShieldX },
  VERY_WEAK: { color: 'text-critical', bg: 'bg-critical', bgFaded: 'bg-critical/10', border: 'border-critical/30', label: 'Very Weak', icon: ShieldX },
  NONE:      { color: 'text-text-dim', bg: 'bg-navy-border', bgFaded: 'bg-navy-card', border: 'border-navy-border', label: 'None', icon: ShieldX },
};

const PasswordStrength = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [result, setResult] = useState(null);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const [triggerCheck, { isLoading }] = useCheckPasswordStrengthMutation();

  const handleCheck = useCallback(async (pwd) => {
    if (!pwd || pwd.length === 0) {
      setResult(null);
      return;
    }
    try {
      const cleanPwd = pwd.substring(0, 128); // Length limit only — don't strip chars from passwords
      const data = await triggerCheck(cleanPwd).unwrap();
      setResult(data);
    } catch {
      // Silently fail — don't expose password in error toasts
    }
  }, [triggerCheck]);

  const handleChange = (e) => {
    const value = e.target.value;
    setPassword(value);

    // Debounce — check after 400ms of no typing
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => handleCheck(value), 400);
    setDebounceTimer(timer);
  };

  const config = result ? STRENGTH_CONFIG[result.strength] || STRENGTH_CONFIG.NONE : null;

  const checks = result?.checks || {};
  const checkItems = [
    { key: 'length', label: 'At least 8 characters', passed: checks.length },
    { key: 'lowercase', label: 'Lowercase letter (a-z)', passed: checks.lowercase },
    { key: 'uppercase', label: 'Uppercase letter (A-Z)', passed: checks.uppercase },
    { key: 'digit', label: 'Number (0-9)', passed: checks.digit },
    { key: 'special', label: 'Special character (!@#$%)', passed: checks.special },
    { key: 'noCommon', label: 'Not a common password', passed: checks.noCommon },
    { key: 'noPattern', label: 'No keyboard/sequential patterns', passed: checks.noPattern },
  ];

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
              <KeyRound className="w-6 h-6 text-blue-accent" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-white">Password Strength</h1>
              <p className="text-text-muted text-sm">Analyze your password with real entropy calculations</p>
            </div>
          </div>
        </div>

        {/* Input Card */}
        <div className="glass-card p-6 mb-6">
          <label className="block text-sm font-medium text-text-muted mb-2">
            Enter a password to analyze
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={handleChange}
              placeholder="Type a password..."
              className="w-full bg-navy border border-navy-border rounded-lg text-text-white placeholder-text-dim px-4 py-3.5 pr-12 text-sm focus:border-blue-accent transition-colors"
              autoComplete="off"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-white transition-colors"
              type="button"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Privacy notice */}
          <div className="flex items-center gap-2 mt-3 text-text-dim text-xs">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Your password is analyzed in-memory and <strong className="text-text-muted">never stored or logged</strong>.</span>
          </div>
        </div>

        {/* Loading */}
        {isLoading && <LoadingSpinner text="Analyzing password..." />}

        {/* Results */}
        <AnimatePresence mode="wait">
          {result && !isLoading && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Strength Card */}
              <div className={`glass-card p-6 border-l-4 ${config.border}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <config.icon className={`w-8 h-8 ${config.color}`} />
                    <div>
                      <h2 className="text-xl font-bold text-text-white">
                        {config.label} Password
                      </h2>
                      <p className="text-text-muted text-sm">
                        Score: {result.score}/100
                      </p>
                    </div>
                  </div>
                  <div className={`${config.bgFaded} ${config.color} px-3 py-1.5 rounded-lg text-sm font-bold`}>
                    {result.score}/100
                  </div>
                </div>

                {/* Score Bar */}
                <div className="w-full h-3 rounded-full bg-navy mb-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${result.score}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${config.bg}`}
                  />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-navy rounded-lg p-3 text-center">
                    <Zap className="w-4 h-4 text-blue-accent mx-auto mb-1" />
                    <p className="text-text-white text-sm font-bold">{result.entropy}</p>
                    <p className="text-text-dim text-xs">Entropy (bits)</p>
                  </div>
                  <div className="bg-navy rounded-lg p-3 text-center">
                    <Clock className="w-4 h-4 text-warn mx-auto mb-1" />
                    <p className="text-text-white text-sm font-bold">{result.crackTime}</p>
                    <p className="text-text-dim text-xs">Crack Time</p>
                  </div>
                  <div className="bg-navy rounded-lg p-3 text-center">
                    <Hash className="w-4 h-4 text-safe mx-auto mb-1" />
                    <p className="text-text-white text-sm font-bold">{result.length}</p>
                    <p className="text-text-dim text-xs">Length</p>
                  </div>
                  <div className="bg-navy rounded-lg p-3 text-center">
                    <KeyRound className="w-4 h-4 text-critical mx-auto mb-1" />
                    <p className="text-text-white text-sm font-bold">{result.charsetSize}</p>
                    <p className="text-text-dim text-xs">Charset Size</p>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-text-white mb-4">Requirements Checklist</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {checkItems.map((item) => (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg ${
                        item.passed ? 'bg-safe/5' : 'bg-danger/5'
                      }`}
                    >
                      <div className={`p-1 rounded-full ${
                        item.passed ? 'bg-safe/20' : 'bg-danger/20'
                      }`}>
                        {item.passed ? (
                          <Check className="w-3.5 h-3.5 text-safe" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-danger" />
                        )}
                      </div>
                      <span className={`text-sm ${
                        item.passed ? 'text-text-muted' : 'text-text-white'
                      }`}>
                        {item.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              {result.feedback && result.feedback.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-text-white mb-4">AI Recommendations</h3>
                  <div className="space-y-2">
                    {result.feedback.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-2.5 p-3 rounded-lg border ${
                          item.type === 'error' ? 'border-danger/20 bg-danger/5' :
                          item.type === 'warning' ? 'border-warn/20 bg-warn/5' :
                          item.type === 'success' ? 'border-safe/20 bg-safe/5' :
                          'border-blue-accent/20 bg-blue-accent/5'
                        }`}
                      >
                        {item.type === 'error' ? (
                          <ShieldX className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                        ) : item.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-warn flex-shrink-0 mt-0.5" />
                        ) : item.type === 'success' ? (
                          <ShieldCheck className="w-4 h-4 text-safe flex-shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-accent flex-shrink-0 mt-0.5" />
                        )}
                        <p className="text-text-muted text-sm">{item.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!result && !isLoading && (
          <div className="glass-card p-12 text-center">
            <KeyRound className="w-16 h-16 text-text-dim mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-white mb-2">Check Your Password</h3>
            <p className="text-text-muted">
              Type a password above to see real-time strength analysis with entropy scoring,
              crack time estimation, and AI-powered recommendations.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PasswordStrength;
