import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Shield, ChevronDown, ChevronUp } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'cyberguard_cookie_consent';

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if user already accepted cookies
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
      essential: true,
      analytics: true,
      functional: true,
    }));
    setVisible(false);
  };

  const handleEssentialOnly = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
      essential: true,
      analytics: false,
      functional: false,
    }));
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Cookie consent card */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[101] p-4 sm:p-6"
          >
            <div className="max-w-3xl mx-auto glass-card p-6 border border-navy-border shadow-2xl shadow-black/50">
              <div className="flex items-start gap-4">
                {/* Cookie icon */}
                <div className="p-3 rounded-xl bg-warn/10 border border-warn/30 flex-shrink-0">
                  <Cookie className="w-6 h-6 text-warn" />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-text-white mb-1">
                    🍪 Cookie & Privacy Consent
                  </h3>
                  <p className="text-text-muted text-sm mb-3">
                    CyberGuard AI uses cookies and local storage to save your scan history, security preferences, and session data.
                    We need your consent before you can access the security dashboard.
                  </p>

                  {/* Details toggle */}
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center gap-1 text-xs text-blue-accent hover:text-blue-600 mb-3 transition-colors"
                  >
                    {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {showDetails ? 'Hide details' : 'Show cookie details'}
                  </button>

                  <AnimatePresence>
                    {showDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-3"
                      >
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-navy/50">
                            <Shield className="w-4 h-4 text-safe flex-shrink-0" />
                            <div>
                              <p className="text-text-white font-medium">Essential Cookies</p>
                              <p className="text-text-dim">Required for login, session management, and security features. Cannot be disabled.</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-navy/50">
                            <Shield className="w-4 h-4 text-blue-accent flex-shrink-0" />
                            <div>
                              <p className="text-text-white font-medium">Functional Cookies</p>
                              <p className="text-text-dim">Store scan history, security scores, and user preferences for a better experience.</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-navy/50">
                            <Shield className="w-4 h-4 text-warn flex-shrink-0" />
                            <div>
                              <p className="text-text-white font-medium">Analytics Cookies</p>
                              <p className="text-text-dim">Help us understand how you use CyberGuard to improve threat detection accuracy.</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleAccept}
                      className="bg-blue-accent hover:bg-blue-600 text-white font-semibold rounded-lg px-6 py-2.5 transition-all duration-300 btn-glow text-sm flex items-center justify-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      Accept All Cookies
                    </button>
                    <button
                      onClick={handleEssentialOnly}
                      className="border border-navy-border text-text-muted hover:text-text-white hover:border-text-dim rounded-lg px-6 py-2.5 transition-all text-sm"
                    >
                      Essential Only
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
