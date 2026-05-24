import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Link,
  Smartphone,
  Lock,
  Wifi,
  Bell,
  Settings,
  Menu,
  X,
  Activity,
  KeyRound,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Info,
  ChevronRight
} from 'lucide-react';
import { useGetSecurityScoreQuery, useGetAlertsQuery } from '../store/api/apiSlice';
import ScoreRing from './ScoreRing';

const navItems = [
  { path: '/', label: 'Dashboard', icon: Activity },
  { path: '/phishing', label: 'Phishing', icon: Link },
  { path: '/malware', label: 'Malware', icon: Smartphone },
  { path: '/breach', label: 'Breach', icon: Lock },
  { path: '/password', label: 'Password', icon: KeyRound },
  { path: '/wifi', label: 'Wi-Fi', icon: Wifi },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertDropdownOpen, setAlertDropdownOpen] = useState(false);
  const alertDropdownRef = useRef(null);
  const navigate = useNavigate();

  const { data: scoreData } = useGetSecurityScoreQuery(undefined, {
    pollingInterval: 30000,
  });

  const { data: alertsData } = useGetAlertsQuery(undefined, {
    pollingInterval: 15000,
  });

  const score = scoreData?.score ?? null;
  const level = scoreData?.level ?? null;

  const allAlerts = alertsData ?? [];
  const unreadAlerts = allAlerts.filter(a => !a.read);
  const unreadCount = unreadAlerts.length;
  const recentAlerts = unreadAlerts.slice(0, 5);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (alertDropdownRef.current && !alertDropdownRef.current.contains(e.target)) {
        setAlertDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getScoreColor = () => {
    if (!level) return 'text-text-muted';
    if (level === 'SAFE') return 'text-safe';
    if (level === 'WARNING') return 'text-warn';
    return 'text-danger';
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'CRITICAL': return <XCircle className="w-4 h-4 text-critical flex-shrink-0" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-warn flex-shrink-0" />;
      case 'SAFE': return <CheckCircle className="w-4 h-4 text-safe flex-shrink-0" />;
      case 'INFO': return <Info className="w-4 h-4 text-blue-accent flex-shrink-0" />;
      default: return <Bell className="w-4 h-4 text-text-dim flex-shrink-0" />;
    }
  };

  const getAlertBubbleColor = (type) => {
    switch (type) {
      case 'CRITICAL': return 'border-critical/30 bg-critical/5';
      case 'WARNING': return 'border-warn/30 bg-warn/5';
      case 'SAFE': return 'border-safe/30 bg-safe/5';
      case 'INFO': return 'border-blue-accent/30 bg-blue-accent/5';
      default: return 'border-navy-border bg-navy-card';
    }
  };

  const timeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-navy-border"
      style={{ background: 'rgba(13, 27, 46, 0.95)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Shield className="w-8 h-8 text-blue-accent group-hover:text-safe transition-colors duration-300" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-safe rounded-full animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-text-white tracking-tight">
                CyberGuard <span className="text-blue-accent">AI</span>
              </span>
              <span className="text-[10px] text-text-dim -mt-1 hidden sm:block">
                Intelligent Security Assistant
              </span>
            </div>
          </NavLink>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-link flex items-center gap-1.5 ${isActive ? 'active' : ''}`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Alert Bell + Score Badge + Mobile Toggle */}
          <div className="flex items-center gap-3">
            {/* Alert Bell with Dropdown */}
            <div className="relative" ref={alertDropdownRef}>
              <button
                onClick={() => setAlertDropdownOpen(!alertDropdownOpen)}
                className="relative p-2 rounded-lg text-text-muted hover:text-text-white hover:bg-navy-card transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full text-[10px] font-bold bg-danger text-white shadow-lg shadow-danger/30"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </motion.span>
                )}
              </button>

              {/* Alert Dropdown Panel */}
              <AnimatePresence>
                {alertDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="alert-notification-dropdown"
                  >
                    {/* Dropdown Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-navy-border">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-blue-accent" />
                        <span className="text-sm font-semibold text-text-white">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-danger/20 text-danger">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setAlertDropdownOpen(false)}
                        className="p-1 rounded text-text-dim hover:text-text-white transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Alert Messages */}
                    <div className="max-h-[320px] overflow-y-auto alert-dropdown-scroll">
                      {recentAlerts.length > 0 ? (
                        <div className="py-2 px-3 space-y-2">
                          {recentAlerts.map((alert) => (
                            <motion.button
                              key={alert._id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              onClick={() => {
                                setAlertDropdownOpen(false);
                                navigate('/alerts');
                              }}
                              className={`alert-bubble w-full text-left p-3 rounded-xl border transition-all hover:brightness-110 ${getAlertBubbleColor(alert.type)}`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`text-[10px] font-bold uppercase ${
                                      alert.type === 'CRITICAL' ? 'text-critical' :
                                      alert.type === 'WARNING' ? 'text-warn' :
                                      alert.type === 'SAFE' ? 'text-safe' : 'text-blue-accent'
                                    }`}>
                                      {alert.type}
                                    </span>
                                    <span className="text-[10px] text-text-dim">{timeAgo(alert.createdAt)}</span>
                                  </div>
                                  <p className="text-xs font-medium text-text-white truncate">{alert.title}</p>
                                  <p className="text-[11px] text-text-dim mt-0.5 line-clamp-2">{alert.description}</p>
                                </div>
                                {/* Unread indicator */}
                                <span className="w-2 h-2 mt-1.5 rounded-full bg-blue-accent animate-pulse flex-shrink-0" />
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 px-4 text-center">
                          <Shield className="w-8 h-8 text-safe/50 mx-auto mb-2" />
                          <p className="text-text-dim text-xs">No unread notifications</p>
                        </div>
                      )}
                    </div>

                    {/* View All Footer */}
                    {allAlerts.length > 0 && (
                      <div className="border-t border-navy-border">
                        <button
                          onClick={() => {
                            setAlertDropdownOpen(false);
                            navigate('/alerts');
                          }}
                          className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 text-xs font-medium text-blue-accent hover:text-blue-400 hover:bg-navy-card/50 transition-colors"
                        >
                          View All Alerts
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Score Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-navy-border bg-navy-card">
              <div className="w-8 h-8">
                <ScoreRing score={score ?? 0} size={32} strokeWidth={3} />
              </div>
              <span className={`text-sm font-bold ${getScoreColor()}`}>
                {score !== null ? score : '--'}
              </span>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 rounded-lg text-text-muted hover:text-text-white hover:bg-navy-card transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t border-navy-border overflow-hidden"
            style={{ background: 'rgba(13, 27, 46, 0.98)' }}
          >
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-accent/10 text-blue-accent'
                        : 'text-text-muted hover:text-text-white hover:bg-navy-card'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.path === '/alerts' && unreadCount > 0 && (
                    <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-[10px] font-bold bg-danger text-white">
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
