import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
  Activity
} from 'lucide-react';
import { getSecurityScore } from '../api/dashboardApi';
import ScoreRing from './ScoreRing';

const navItems = [
  { path: '/', label: 'Dashboard', icon: Activity },
  { path: '/phishing', label: 'Phishing', icon: Link },
  { path: '/malware', label: 'Malware', icon: Smartphone },
  { path: '/breach', label: 'Breach', icon: Lock },
  { path: '/wifi', label: 'Wi-Fi', icon: Wifi },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: scoreData } = useQuery({
    queryKey: ['navbarScore'],
    queryFn: getSecurityScore,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const score = scoreData?.data?.score ?? null;
  const level = scoreData?.data?.level ?? null;

  const getScoreColor = () => {
    if (!level) return 'text-text-muted';
    if (level === 'SAFE') return 'text-safe';
    if (level === 'WARNING') return 'text-warn';
    return 'text-danger';
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

          {/* Score Badge + Mobile Toggle */}
          <div className="flex items-center gap-3">
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
