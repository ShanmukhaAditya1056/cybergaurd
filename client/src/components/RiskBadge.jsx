import React from 'react';

const RiskBadge = ({ risk, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm'
  };

  const riskConfig = {
    LOW: {
      className: 'bg-safe-bg text-safe border border-safe/30',
      label: 'LOW'
    },
    MEDIUM: {
      className: 'bg-warn-bg text-warn border border-warn/30',
      label: 'MEDIUM'
    },
    HIGH: {
      className: 'bg-danger-bg text-danger border border-danger/30',
      label: 'HIGH'
    },
    CRITICAL: {
      className: 'bg-critical-bg text-critical border border-critical/30',
      label: 'CRITICAL'
    },
    SAFE: {
      className: 'bg-safe-bg text-safe border border-safe/30',
      label: 'SAFE'
    },
    PHISHING: {
      className: 'bg-danger-bg text-danger border border-danger/30',
      label: 'PHISHING'
    },
    NONE: {
      className: 'bg-safe-bg text-safe border border-safe/30',
      label: 'NONE'
    }
  };

  const config = riskConfig[risk] || riskConfig.LOW;

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${sizeClasses[size]} ${config.className}`}
    >
      {config.label}
    </span>
  );
};

export default RiskBadge;
