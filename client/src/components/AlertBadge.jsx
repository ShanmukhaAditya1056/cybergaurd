import React from 'react';
import { Bell } from 'lucide-react';

const AlertBadge = ({ count = 0 }) => {
  if (count === 0) return null;

  return (
    <div className="relative inline-flex">
      <Bell className="w-5 h-5 text-text-muted" />
      <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-danger rounded-full animate-pulse">
        {count > 99 ? '99+' : count}
      </span>
    </div>
  );
};

export default AlertBadge;
