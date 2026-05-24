import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Monitor, Wifi, HardDrive, Globe, Check, Fingerprint } from 'lucide-react';

const PERMISSIONS_KEY = 'cyberguard_device_permissions';
const COOKIE_CONSENT_KEY = 'cyberguard_cookie_consent';

const PermissionItem = ({ icon: Icon, title, description, granted, onToggle, required }) => (
  <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
    granted
      ? 'border-safe/30 bg-safe-bg/30'
      : 'border-navy-border bg-navy/30'
  }`}>
    <div className={`p-2 rounded-lg flex-shrink-0 ${granted ? 'bg-safe/20' : 'bg-navy-border/50'}`}>
      <Icon className={`w-4 h-4 ${granted ? 'text-safe' : 'text-text-dim'}`} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-text-white">{title}</p>
        {required && <span className="text-xs text-warn">Required</span>}
      </div>
      <p className="text-xs text-text-dim">{description}</p>
    </div>
    <button
      onClick={onToggle}
      className={`flex-shrink-0 w-10 h-6 rounded-full relative transition-all duration-300 ${
        granted ? 'bg-safe' : 'bg-navy-border'
      } ${required ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      disabled={required}
    >
      <motion.div
        animate={{ x: granted ? 16 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
      />
    </button>
  </div>
);

const PermissionsGate = ({ children }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissions, setPermissions] = useState({
    systemScan: true,
    networkScan: true,
    wifiScan: true,
    processScan: true,
  });

  useEffect(() => {
    // Wait for cookies to be accepted first
    const checkPermissions = () => {
      const cookieConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!cookieConsent) return; // Wait for cookies first

      const savedPerms = localStorage.getItem(PERMISSIONS_KEY);
      if (!savedPerms) {
        // Show permissions prompt after a short delay
        const timer = setTimeout(() => setShowPrompt(true), 500);
        return () => clearTimeout(timer);
      }
    };

    // Check immediately and also listen for storage changes
    checkPermissions();
    const interval = setInterval(checkPermissions, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleGrantAll = () => {
    const allPerms = {
      systemScan: true,
      networkScan: true,
      wifiScan: true,
      processScan: true,
      grantedAt: new Date().toISOString(),
    };
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(allPerms));
    setPermissions(allPerms);
    setShowPrompt(false);
    // Notify other components of permission change
    window.dispatchEvent(new CustomEvent('cyberguard-permissions-changed', { detail: allPerms }));
  };

  const handleContinue = () => {
    const perms = {
      ...permissions,
      grantedAt: new Date().toISOString(),
    };
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(perms));
    setShowPrompt(false);
    // Notify other components of permission change
    window.dispatchEvent(new CustomEvent('cyberguard-permissions-changed', { detail: perms }));
  };

  const togglePermission = (key) => {
    if (key === 'systemScan') return; // Required, can't toggle off
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <>
      {children}

      <AnimatePresence>
        {showPrompt && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
            />

            {/* Permissions dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[201] flex items-center justify-center p-4"
            >
              <div className="glass-card p-6 max-w-lg w-full border border-navy-border shadow-2xl shadow-black/50">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-blue-accent/10 border border-blue-accent/30">
                    <Fingerprint className="w-7 h-7 text-blue-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-white">Device Permissions</h2>
                    <p className="text-text-dim text-xs">CyberGuard needs access to scan your device</p>
                  </div>
                </div>

                <p className="text-text-muted text-sm mb-4">
                  To provide real-time security analysis, CyberGuard needs permission to read your system information.
                  All scans are performed locally — no data leaves your device.
                </p>

                {/* Privacy notice */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-safe-bg/30 border border-safe/20 mb-4">
                  <Shield className="w-4 h-4 text-safe flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-safe">
                    🔒 All scanning is done locally on your device. No personal data is transmitted to external servers.
                  </p>
                </div>

                {/* Permission toggles */}
                <div className="space-y-2 mb-5">
                  <PermissionItem
                    icon={Monitor}
                    title="System Information"
                    description="Read device name, OS version, CPU, and memory"
                    granted={permissions.systemScan}
                    onToggle={() => togglePermission('systemScan')}
                    required
                  />
                  <PermissionItem
                    icon={HardDrive}
                    title="Installed Programs"
                    description="Scan installed software for security risks"
                    granted={permissions.processScan}
                    onToggle={() => togglePermission('processScan')}
                  />
                  <PermissionItem
                    icon={Globe}
                    title="Network Ports"
                    description="Check open ports for potential backdoors"
                    granted={permissions.networkScan}
                    onToggle={() => togglePermission('networkScan')}
                  />
                  <PermissionItem
                    icon={Wifi}
                    title="WiFi Network"
                    description="Auto-detect connected WiFi for security analysis"
                    granted={permissions.wifiScan}
                    onToggle={() => togglePermission('wifiScan')}
                  />
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleGrantAll}
                    className="flex-1 bg-blue-accent hover:bg-blue-600 text-white font-semibold rounded-lg px-6 py-3 transition-all duration-300 btn-glow text-sm flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Grant All Permissions
                  </button>
                  <button
                    onClick={handleContinue}
                    className="flex-1 border border-navy-border text-text-muted hover:text-text-white hover:border-text-dim rounded-lg px-6 py-3 transition-all text-sm"
                  >
                    Continue with Selected
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default PermissionsGate;
