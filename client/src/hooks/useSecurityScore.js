import { useQuery } from '@tanstack/react-query';
import { getSecurityScore } from '../api/dashboardApi';

/**
 * Custom hook to fetch and manage the unified security score
 * Provides score, level, breakdown, and loading state
 */
const useSecurityScore = (options = {}) => {
  const {
    refetchInterval = 30000,
    enabled = true,
  } = options;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['securityScore'],
    queryFn: getSecurityScore,
    refetchInterval,
    enabled,
    staleTime: 15000,
  });

  const score = data?.data?.score ?? null;
  const level = data?.data?.level ?? null;
  const breakdown = data?.data?.breakdown ?? {};
  const history = data?.data?.history ?? [];

  const getScoreColor = () => {
    if (!level) return '#4A7AA8';
    if (level === 'SAFE') return '#4CAF82';
    if (level === 'WARNING') return '#F0A030';
    return '#E05555';
  };

  return {
    score,
    level,
    breakdown,
    history,
    isLoading,
    isError,
    error,
    refetch,
    getScoreColor,
  };
};

export default useSecurityScore;
