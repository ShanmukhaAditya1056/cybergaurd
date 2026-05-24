import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, Shield, Lock, Trash2, Bell, Clipboard, Clock,
  CheckCircle, Award, Info, AlertTriangle, Fingerprint, Monitor, HardDrive, Globe, Wifi
} from 'lucide-react';
import { useClearAllScansMutation, useHealthCheckQuery } from '../store/api/apiSlice';
import { toggleRealTimeAlerts, toggleClipboardScanner, setScanFrequency } from '../store/slices/settingsSlice';
import { getDevicePermissions, saveDevicePermissions } from '../utils/permissionUtils';
import toast from 'react-hot-toast';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20 }
};

// System Status Panel — shows API, MongoDB, and ML service health
const SystemStatusPanel = () => {
  const { data: healthData, isLoading, isError } = useHealthCheckQuery(undefined, {
    pollingInterval: 30000,
  });

  if (isLoading) {
    return <p className="text-text-dim text-sm">Checking system status...</p>;
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/5 border border-danger/20">
        <div className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse" />
        <span className="text-danger text-sm font-medium">Server unreachable</span>
      </div>
    );
  }

  const statuses = [
    { label: 'API Server', ok: true, detail: `v${healthData?.version || '2.0.0'}` },
    { label: 'MongoDB', ok: healthData?.mongoConnected, detail: healthData?.mongoConnected ? 'Connected' : 'In-memory fallback' },
    { label: 'ML Service', ok: healthData?.mlServiceAvailable, detail: healthData?.mlServiceAvailable ? 'Connected — AI predictions active' : 'Offline — using rule-based fallback' },
  ];

  return (
    <div className="space-y-2">
      {statuses.map((s) => (
        <div key={s.label} className="flex items-center justify-between p-3 rounded-lg bg-navy border border-navy-border">
          <div className="flex items-center gap-2.5">
            <div className={`w-2.5 h-2.5 rounded-full ${s.ok ? 'bg-safe' : 'bg-warn'} ${s.ok ? '' : 'animate-pulse'}`} />
            <span className="text-text-white text-sm font-medium">{s.label}</span>
          </div>
          <span className={`text-xs ${s.ok ? 'text-safe' : 'text-warn'}`}>{s.detail}</span>
        </div>
      ))}
    </div>
  );
};

const Settings = () => {
  // Device permissions management
  const [permissions, setPermissions] = useState(() => getDevicePermissions());

  useEffect(() => {
    const handlePermChange = () => setPermissions(getDevicePermissions());
    window.addEventListener('cyberguard-permissions-changed', handlePermChange);
    window.addEventListener('storage', handlePermChange);
    return () => {
      window.removeEventListener('cyberguard-permissions-changed', handlePermChange);
      window.removeEventListener('storage', handlePermChange);
    };
  }, []);
  const dispatch = useDispatch();
  const { realTimeAlerts, clipboardScanner, scanFrequency } = useSelector((state) => state.settings);

  const [triggerClear, { isLoading: isClearing }] = useClearAllScansMutation();

  const handleClearAll = async () => {
    try {
      await triggerClear().unwrap();
      toast.success('All scan history cleared');
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to clear history');
    }
  };

  const mlModels = [
    { name: 'DistilBERT', task: 'Phishing NLP Detection', accuracy: '96.8%' },
    { name: 'RF + LightGBM', task: 'Permission Risk Classification', accuracy: '94.2%' },
    { name: 'Graph Neural Network (GNN)', task: 'Permission Relationship Analysis', accuracy: '93.5%' },
    { name: 'Isolation Forest', task: 'Anomaly Detection', accuracy: '91.7%' },
    { name: 'SHAP', task: 'Explainable AI / Feature Attribution', accuracy: 'N/A' }
  ];

  const compliance = [
    { name: 'CERT-In', description: 'Indian Computer Emergency Response Team guidelines' },
    { name: 'OWASP Mobile Top 10', description: 'Mobile application security best practices' },
    { name: 'IEEE 7000', description: 'Ethical AI and system design standards' },
    { name: 'ISO/IEC 23894', description: 'AI risk management framework' },
    { name: 'NIST CSF 2.0', description: 'Cybersecurity framework for critical infrastructure' },
    { name: 'DPDPA 2023', description: 'India\'s Digital Personal Data Protection Act' }
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
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-blue-accent/10 border border-blue-accent/30">
            <SettingsIcon className="w-6 h-6 text-blue-accent" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-white">Settings</h1>
            <p className="text-text-muted text-sm">Configure your security preferences</p>
          </div>
        </div>

        {/* Device Permissions */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-white mb-4 flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-blue-accent" />
            Device Permissions
          </h2>
          <p className="text-text-dim text-xs mb-4">
            Control which system features CyberGuard can access. Denied permissions will skip those scan categories.
          </p>
          <div className="space-y-3">
            {/* System Info — always required */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-navy border border-navy-border">
              <div className="flex items-center gap-3 min-w-0">
                <Monitor className="w-5 h-5 text-text-dim flex-shrink-0" />
                <div>
                  <p className="text-text-white text-sm font-medium">System Information</p>
                  <p className="text-text-dim text-xs">Read device name, OS, CPU, memory</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-warn">Required</span>
                <button
                  disabled
                  className="inline-flex items-center flex-shrink-0 w-11 h-6 rounded-full bg-safe cursor-not-allowed"
                >
                  <span className="inline-block w-4 h-4 rounded-full bg-white shadow-sm translate-x-6" />
                </button>
              </div>
            </div>

            {/* Installed Programs */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-navy border border-navy-border">
              <div className="flex items-center gap-3 min-w-0">
                <HardDrive className="w-5 h-5 text-text-dim flex-shrink-0" />
                <div>
                  <p className="text-text-white text-sm font-medium">Installed Programs</p>
                  <p className="text-text-dim text-xs">Scan installed software, processes, and startup items</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const newPerms = { ...permissions, processScan: !permissions.processScan };
                  saveDevicePermissions(newPerms);
                  setPermissions(newPerms);
                  toast.success(`Installed Programs scanning ${newPerms.processScan ? 'enabled' : 'disabled'}`);
                }}
                className={`inline-flex items-center flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                  permissions.processScan ? 'bg-safe' : 'bg-navy-border'
                }`}
              >
                <span className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  permissions.processScan ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Network Ports */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-navy border border-navy-border">
              <div className="flex items-center gap-3 min-w-0">
                <Globe className="w-5 h-5 text-text-dim flex-shrink-0" />
                <div>
                  <p className="text-text-white text-sm font-medium">Network Ports</p>
                  <p className="text-text-dim text-xs">Check open ports for potential backdoors</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const newPerms = { ...permissions, networkScan: !permissions.networkScan };
                  saveDevicePermissions(newPerms);
                  setPermissions(newPerms);
                  toast.success(`Network Ports scanning ${newPerms.networkScan ? 'enabled' : 'disabled'}`);
                }}
                className={`inline-flex items-center flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                  permissions.networkScan ? 'bg-safe' : 'bg-navy-border'
                }`}
              >
                <span className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  permissions.networkScan ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* WiFi */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-navy border border-navy-border">
              <div className="flex items-center gap-3 min-w-0">
                <Wifi className="w-5 h-5 text-text-dim flex-shrink-0" />
                <div>
                  <p className="text-text-white text-sm font-medium">WiFi Network</p>
                  <p className="text-text-dim text-xs">Auto-detect connected WiFi for security analysis</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const newPerms = { ...permissions, wifiScan: !permissions.wifiScan };
                  saveDevicePermissions(newPerms);
                  setPermissions(newPerms);
                  toast.success(`WiFi scanning ${newPerms.wifiScan ? 'enabled' : 'disabled'}`);
                }}
                className={`inline-flex items-center flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                  permissions.wifiScan ? 'bg-safe' : 'bg-navy-border'
                }`}
              >
                <span className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  permissions.wifiScan ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Protection Settings */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-accent" />
            Protection Settings
          </h2>

          <div className="space-y-4">
            {/* Real-time Alerts */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-navy border border-navy-border">
              <div className="flex items-center gap-3 min-w-0">
                <Bell className="w-5 h-5 text-text-dim flex-shrink-0" />
                <div>
                  <p className="text-text-white text-sm font-medium">Real-time Alerts</p>
                  <p className="text-text-dim text-xs">Get notified instantly about security threats</p>
                </div>
              </div>
              <button
                onClick={() => dispatch(toggleRealTimeAlerts())}
                className={`inline-flex items-center flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                  realTimeAlerts ? 'bg-safe' : 'bg-navy-border'
                }`}
              >
                <span className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  realTimeAlerts ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Clipboard Scanner */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-navy border border-navy-border">
              <div className="flex items-center gap-3 min-w-0">
                <Clipboard className="w-5 h-5 text-text-dim flex-shrink-0" />
                <div>
                  <p className="text-text-white text-sm font-medium">Clipboard Scanner</p>
                  <p className="text-text-dim text-xs">Automatically scan copied URLs for phishing</p>
                </div>
              </div>
              <button
                onClick={() => dispatch(toggleClipboardScanner())}
                className={`inline-flex items-center flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                  clipboardScanner ? 'bg-safe' : 'bg-navy-border'
                }`}
              >
                <span className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  clipboardScanner ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Scan Frequency */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-navy border border-navy-border">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-text-dim" />
                <div>
                  <p className="text-text-white text-sm font-medium">Auto Scan Frequency</p>
                  <p className="text-text-dim text-xs">How often to run background security scans</p>
                </div>
              </div>
              <select
                value={scanFrequency}
                onChange={(e) => dispatch(setScanFrequency(e.target.value))}
                className="bg-navy border border-navy-border rounded-lg text-text-white px-3 py-1.5 text-sm appearance-none cursor-pointer"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-safe" />
            Privacy & Data Protection
          </h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-safe-bg/30 border border-safe/20">
              <CheckCircle className="w-5 h-5 text-safe flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-text-white text-sm font-medium">Zero Data Collection</p>
                <p className="text-text-dim text-xs">
                  CyberGuard AI does not collect, store, or transmit your personal data to any third party. 
                  All analysis happens locally on this server.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-safe-bg/30 border border-safe/20">
              <CheckCircle className="w-5 h-5 text-safe flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-text-white text-sm font-medium">k-Anonymity Protection</p>
                <p className="text-text-dim text-xs">
                  Breach checks use k-Anonymity protocol — only the first 5 characters of your hashed credential 
                  are sent for verification. Your full email or phone never leaves the server.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-safe-bg/30 border border-safe/20">
              <CheckCircle className="w-5 h-5 text-safe flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-text-white text-sm font-medium">SHA-256 Local Encryption</p>
                <p className="text-text-dim text-xs">
                  All sensitive data processed locally is encrypted using SHA-256 hashing algorithm 
                  before any storage or comparison operations.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-accent/5 border border-blue-accent/20">
              <Award className="w-5 h-5 text-blue-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-text-white text-sm font-medium">DPDPA 2023 Compliant</p>
                <p className="text-text-dim text-xs">
                  Fully compliant with India's Digital Personal Data Protection Act 2023. 
                  We follow data minimization principles and provide complete transparency in data handling.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-white mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-accent" />
            About CyberGuard AI
          </h2>

          <div className="flex items-center gap-3 mb-6 p-4 rounded-lg bg-navy border border-navy-border">
            <Shield className="w-8 h-8 text-blue-accent" />
            <div>
              <h3 className="text-text-white font-semibold">CyberGuard AI</h3>
              <p className="text-text-dim text-xs">Version 2.0 • Intelligent Mobile Security Assistant</p>
            </div>
          </div>

          {/* System Status */}
          <div className="glass-card p-6 mb-6">
            <h2 className="text-lg font-semibold text-text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-accent" />
              System Status
            </h2>

            <SystemStatusPanel />
          </div>

          {/* Data Management */}
          <h3 className="text-sm font-semibold text-text-muted mb-3">🧠 AI/ML Models</h3>
          <div className="space-y-2 mb-6">
            {mlModels.map((model, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-navy/50 border border-navy-border">
                <div>
                  <p className="text-text-white text-sm font-medium">{model.name}</p>
                  <p className="text-text-dim text-xs">{model.task}</p>
                </div>
                <span className="text-safe text-sm font-bold">{model.accuracy}</span>
              </div>
            ))}
          </div>

          {/* Compliance Standards */}
          <h3 className="text-sm font-semibold text-text-muted mb-3">📋 Compliance Standards</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {compliance.map((std, idx) => (
              <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-navy/50 border border-navy-border">
                <CheckCircle className="w-4 h-4 text-safe flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-text-white text-xs font-medium">{std.name}</p>
                  <p className="text-text-dim text-[10px]">{std.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clear History */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-danger" />
            Danger Zone
          </h2>
          <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-danger/20 bg-danger-bg/30">
            <div className="min-w-0">
              <p className="text-text-white text-sm font-medium mb-1">Clear All Scan History</p>
              <p className="text-text-dim text-xs">
                Permanently delete all scan results, alerts, and breach logs. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => {
                toast((t) => (
                  <div className="flex flex-col gap-3 max-w-sm">
                    <p className="text-sm font-medium" style={{ color: '#E8F0FA' }}>⚠️ Delete ALL scan history, alerts & breach logs?</p>
                    <p className="text-xs" style={{ color: '#8BA4C2' }}>This is permanent and cannot be undone.</p>
                    <div className="flex gap-2 justify-end mt-2">
                      <button 
                        onClick={() => toast.dismiss(t.id)} 
                        className="px-4 py-2 text-xs font-semibold rounded-lg transition-all"
                        style={{ border: '1px solid #1A3C5E', color: '#8BA4C2' }}
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => { handleClearAll(); toast.dismiss(t.id); }} 
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all"
                      >
                        Yes, Delete Everything
                      </button>
                    </div>
                  </div>
                ), { duration: 6000, position: 'top-center' });
              }}
              disabled={isClearing}
              className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-danger/20 text-danger border border-danger/30 hover:bg-danger/30 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {isClearing ? 'Clearing...' : 'Clear All History'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
