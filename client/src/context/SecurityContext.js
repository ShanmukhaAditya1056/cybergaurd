import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSecurityScore } from '../api/dashboardApi';

const SecurityContext = createContext();

export const SecurityProvider = ({ children }) => {
  const [securityScore, setSecurityScore] = useState(null);
  const [scoreLevel, setScoreLevel] = useState(null);
  const [scoreBreakdown, setScoreBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchScore = async () => {
    try {
      const response = await getSecurityScore();
      if (response?.data) {
        setSecurityScore(response.data.score);
        setScoreLevel(response.data.level);
        setScoreBreakdown(response.data.breakdown);
      }
    } catch (error) {
      console.error('Failed to fetch security score:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScore();
    // Refresh score every 30 seconds
    const interval = setInterval(fetchScore, 30000);
    return () => clearInterval(interval);
  }, []);

  const refreshScore = () => {
    fetchScore();
  };

  return (
    <SecurityContext.Provider
      value={{
        securityScore,
        scoreLevel,
        scoreBreakdown,
        loading,
        refreshScore
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

export default SecurityContext;
