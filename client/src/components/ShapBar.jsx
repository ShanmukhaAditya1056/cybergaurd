import React from 'react';
import { motion } from 'framer-motion';

const ShapBar = ({ feature, score, direction = 'danger', description, index = 0 }) => {
  const percentage = Math.min(Math.abs(score) * 100, 100);

  const colorMap = {
    danger: { bar: 'bg-danger', bg: 'bg-danger/10', text: 'text-danger' },
    warning: { bar: 'bg-warn', bg: 'bg-warn/10', text: 'text-warn' },
    safe: { bar: 'bg-safe', bg: 'bg-safe/10', text: 'text-safe' },
  };

  const colors = colorMap[direction] || colorMap.danger;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between">
        <span className="text-text-white text-sm font-medium">{feature}</span>
        <span className={`text-xs font-semibold ${colors.text}`}>
          {direction === 'safe' ? '−' : '+'}{(Math.abs(score)).toFixed(2)}
        </span>
      </div>
      <div className={`w-full h-2.5 rounded-full ${colors.bg}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
          className={`h-full rounded-full ${colors.bar}`}
          style={{ boxShadow: `0 0 8px ${direction === 'safe' ? 'rgba(76,175,130,0.4)' : direction === 'warning' ? 'rgba(240,160,48,0.4)' : 'rgba(224,85,85,0.4)'}` }}
        />
      </div>
      {description && (
        <p className="text-text-dim text-xs">{description}</p>
      )}
    </motion.div>
  );
};

export default ShapBar;
