import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

const ThreatCard = ({ type = 'WARNING', title, description, timestamp, module, onClick }) => {
  const config = {
    CRITICAL: {
      icon: XCircle,
      bg: 'bg-critical-bg/50',
      border: 'border-critical/30',
      badge: 'bg-critical/20 text-critical',
      iconColor: 'text-critical'
    },
    WARNING: {
      icon: AlertTriangle,
      bg: 'bg-warn-bg/50',
      border: 'border-warn/30',
      badge: 'bg-warn/20 text-warn',
      iconColor: 'text-warn'
    },
    SAFE: {
      icon: CheckCircle,
      bg: 'bg-safe-bg/50',
      border: 'border-safe/30',
      badge: 'bg-safe/20 text-safe',
      iconColor: 'text-safe'
    },
    INFO: {
      icon: Info,
      bg: 'bg-blue-accent/5',
      border: 'border-blue-accent/30',
      badge: 'bg-blue-accent/20 text-blue-accent',
      iconColor: 'text-blue-accent'
    }
  };

  const c = config[type] || config.WARNING;
  const Icon = c.icon;

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${c.bg} ${c.border} border rounded-xl p-4 cursor-pointer hover:border-opacity-60 transition-all duration-200`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${c.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`${c.badge} px-2 py-0.5 rounded-full text-xs font-semibold`}>
              {type}
            </span>
            {module && (
              <span className="text-text-dim text-xs">{module}</span>
            )}
          </div>
          <h4 className="text-text-white text-sm font-medium truncate">{title}</h4>
          <p className="text-text-muted text-xs mt-1 line-clamp-2">{description}</p>
          {timestamp && (
            <p className="text-text-dim text-xs mt-2">{formatTime(timestamp)}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ThreatCard;
