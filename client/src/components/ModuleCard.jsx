import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const ModuleCard = ({ icon: Icon, title, status, lastScan, path, color = 'blue' }) => {
  const navigate = useNavigate();

  const colorMap = {
    blue: { border: 'border-blue-accent/30', bg: 'from-blue-accent/10 to-transparent', icon: 'text-blue-accent', hover: 'hover:border-blue-accent/60' },
    green: { border: 'border-safe/30', bg: 'from-safe/10 to-transparent', icon: 'text-safe', hover: 'hover:border-safe/60' },
    red: { border: 'border-danger/30', bg: 'from-danger/10 to-transparent', icon: 'text-danger', hover: 'hover:border-danger/60' },
    amber: { border: 'border-warn/30', bg: 'from-warn/10 to-transparent', icon: 'text-warn', hover: 'hover:border-warn/60' },
  };

  const colors = colorMap[color] || colorMap.blue;

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Not scanned yet';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`glass-card cursor-pointer ${colors.border} ${colors.hover} transition-all duration-300 p-5 bg-gradient-to-br ${colors.bg}`}
      onClick={() => navigate(path)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-navy-card border border-navy-border ${colors.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${
            status?.includes('Clear') || status?.includes('Safe') || status === 'Not Scanned'
              ? 'bg-safe'
              : status?.includes('Threat') || status?.includes('Breach')
              ? 'bg-danger animate-pulse'
              : 'bg-warn'
          }`} />
        </div>
      </div>

      <h3 className="text-text-white font-semibold text-sm mb-1">{title}</h3>
      <p className="text-text-dim text-xs mb-3">{status || 'Not scanned yet'}</p>

      <div className="flex items-center justify-between text-xs text-text-dim">
        <span>{formatTime(lastScan)}</span>
        <span className="text-blue-accent font-medium">View →</span>
      </div>
    </motion.div>
  );
};

export default ModuleCard;
