import React, { useEffect, useState } from 'react';

const ScoreRing = ({ score = 0, size = 140, strokeWidth = 8, showLabel = true, animated = true }) => {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;

  // Determine color based on score
  const getColor = () => {
    if (displayScore >= 70) return '#4CAF82'; // safe
    if (displayScore >= 40) return '#F0A030'; // warn
    return '#E05555'; // danger
  };

  const getGlowColor = () => {
    if (displayScore >= 70) return 'rgba(76, 175, 130, 0.3)';
    if (displayScore >= 40) return 'rgba(240, 160, 48, 0.3)';
    return 'rgba(224, 85, 85, 0.3)';
  };

  const getLabel = () => {
    if (displayScore >= 70) return 'SAFE';
    if (displayScore >= 40) return 'WARNING';
    return 'CRITICAL';
  };

  // Animate score count up
  useEffect(() => {
    if (!animated) {
      setDisplayScore(score);
      return;
    }

    let start = 0;
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * score);
      setDisplayScore(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score, animated]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1A3C5E"
          strokeWidth={strokeWidth}
          opacity={0.4}
        />
        {/* Score circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: animated ? 'stroke-dashoffset 1.5s ease-out, stroke 0.5s ease' : 'none',
            filter: `drop-shadow(0 0 6px ${getGlowColor()})`
          }}
        />
      </svg>
      {/* Center label */}
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold leading-none"
            style={{
              fontSize: size * 0.28,
              color: getColor()
            }}
          >
            {displayScore}
          </span>
          {size >= 80 && (
            <span
              className="font-semibold uppercase tracking-wider mt-0.5"
              style={{
                fontSize: Math.max(8, size * 0.08),
                color: getColor(),
                opacity: 0.8
              }}
            >
              {getLabel()}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ScoreRing;
