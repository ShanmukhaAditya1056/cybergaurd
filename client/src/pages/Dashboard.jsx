import React from 'react';
import { motion } from 'framer-motion';
import { Link as LinkIcon, Smartphone, Lock, Wifi, Shield, Zap, TrendingUp, Bell, WifiOff, RefreshCw } from 'lucide-react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import {
  useGetSecurityScoreQuery,
  useGetDashboardStatsQuery,
  useGetAlertsQuery,
  useScanMalwareMutation,
} from '../store/api/apiSlice';
import { buildScanPermissionsPayload } from '../utils/permissionUtils';
import ScoreRing from '../components/ScoreRing';
import ModuleCard from '../components/ModuleCard';
import ThreatCard from '../components/ThreatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
  exit: { opacity: 0, y: -20 }
};

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

const Dashboard = () => {
  const {
    data: scoreData,
    isLoading: scoreLoading,
    isError: scoreError,
    isFetching: scoreFetching,
    refetch: refetchScore
  } = useGetSecurityScoreQuery(undefined, {
    pollingInterval: 30000,
  });

  const { data: statsData, isLoading: statsLoading, isError: statsError } = useGetDashboardStatsQuery(undefined, {
    pollingInterval: 30000,
  });

  const { data: alertsData } = useGetAlertsQuery();

  const [triggerQuickScan, { isLoading: quickScanLoading }] = useScanMalwareMutation();

  const handleQuickScan = async () => {
    try {
      const scanPerms = buildScanPermissionsPayload();
      await triggerQuickScan(scanPerms).unwrap();
      toast.success('Quick scan completed!');
    } catch (error) {
      toast.error(error?.data?.message || 'Scan failed');
    }
  };

  const isServerDown = scoreError && statsError;

  if (scoreLoading || statsLoading) {
    return <LoadingSpinner fullPage text="Loading security dashboard..." />;
  }

  const score = scoreData?.score ?? 0;
  const breakdown = scoreData?.breakdown ?? {};
  const history = scoreData?.history ?? [];
  const stats = statsData ?? {};
  const modules = stats.modules ?? {};
  const recentAlerts = (alertsData ?? []).slice(0, 5);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card px-3 py-2 text-sm">
          <p className="text-text-muted">{label}</p>
          <p className="text-blue-accent font-bold">{payload[0].value}/100</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-navy pt-20 pb-10 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Server error banner */}
        {isServerDown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center justify-between p-3 rounded-xl bg-danger/10 border border-danger/20"
          >
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-danger" />
              <span className="text-danger text-sm font-medium">Server unreachable — showing cached data</span>
            </div>
            <button
              onClick={refetchScore}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-danger/20 text-danger hover:bg-danger/30 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </motion.div>
        )}

        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-white mb-2">Security Dashboard</h1>
              <p className="text-text-muted">Your mobile security at a glance</p>
            </div>
            {scoreFetching && !scoreLoading && (
              <RefreshCw className="w-4 h-4 text-blue-accent animate-spin" />
            )}
          </div>
        </motion.div>

        {/* Score + Quick Actions Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Score Card */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <div className="glass-card p-6 flex flex-col items-center">
              <h2 className="text-text-muted text-sm font-medium mb-4">Security Score</h2>
              <ScoreRing score={score} size={160} strokeWidth={10} />
              <div className="mt-4 grid grid-cols-2 gap-3 w-full">
                <div className="text-center p-2 rounded-lg bg-navy/50">
                  <p className="text-xs text-text-dim">Phishing</p>
                  <p className="text-sm font-bold text-text-white">{breakdown?.phishing?.score ?? '--'}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-navy/50">
                  <p className="text-xs text-text-dim">Malware</p>
                  <p className="text-sm font-bold text-text-white">{breakdown?.malware?.score ?? '--'}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-navy/50">
                  <p className="text-xs text-text-dim">Breach</p>
                  <p className="text-sm font-bold text-text-white">{breakdown?.breach?.score ?? '--'}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-navy/50">
                  <p className="text-xs text-text-dim">Wi-Fi</p>
                  <p className="text-sm font-bold text-text-white">{breakdown?.wifi?.score ?? '--'}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats + Quick Scan */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="glass-card p-4 text-center">
                <Zap className="w-5 h-5 text-blue-accent mx-auto mb-2" />
                <p className="text-2xl font-bold text-text-white">{stats.totalScans ?? 0}</p>
                <p className="text-xs text-text-dim">Total Scans</p>
              </div>
              <div className="glass-card p-4 text-center">
                <Shield className="w-5 h-5 text-danger mx-auto mb-2" />
                <p className="text-2xl font-bold text-text-white">{stats.threatsFound ?? 0}</p>
                <p className="text-xs text-text-dim">Threats Found</p>
              </div>
              <div className="glass-card p-4 text-center">
                <Lock className="w-5 h-5 text-warn mx-auto mb-2" />
                <p className="text-2xl font-bold text-text-white">{stats.breachChecks ?? 0}</p>
                <p className="text-xs text-text-dim">Breach Checks</p>
              </div>
              <div className="glass-card p-4 text-center">
                <Bell className="w-5 h-5 text-safe mx-auto mb-2" />
                <p className="text-2xl font-bold text-text-white">{stats.unreadAlerts ?? 0}</p>
                <p className="text-xs text-text-dim">Unread Alerts</p>
              </div>
            </div>

            {/* Score Trend Chart */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-accent" />
                  <h3 className="text-text-white text-sm font-semibold">Score Trend (7 Days)</h3>
                </div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2E75B6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2E75B6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      tick={{ fill: '#4A7AA8', fontSize: 12 }}
                      axisLine={{ stroke: '#1A3C5E' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: '#4A7AA8', fontSize: 12 }}
                      axisLine={{ stroke: '#1A3C5E' }}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#2E75B6"
                      strokeWidth={2}
                      fill="url(#scoreGradient)"
                      dot={{ fill: '#2E75B6', strokeWidth: 0, r: 4 }}
                      activeDot={{ fill: '#2E75B6', strokeWidth: 2, stroke: '#E8F0FA', r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Scan Button */}
        <motion.div variants={itemVariants} className="mb-8">
          <button
            onClick={() => handleQuickScan()}
            disabled={quickScanLoading}
            className="w-full sm:w-auto bg-blue-accent hover:bg-blue-600 text-white font-semibold rounded-xl px-8 py-3.5 transition-all duration-300 btn-glow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-5 h-5" />
            {quickScanLoading ? 'Scanning...' : 'Quick Security Scan'}
          </button>
        </motion.div>

        {/* Module Cards */}
        <motion.div variants={itemVariants} className="mb-8">
          <h2 className="text-lg font-semibold text-text-white mb-4">Security Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ModuleCard
              icon={LinkIcon}
              title="Phishing Scanner"
              status={modules.phishing?.status}
              lastScan={modules.phishing?.lastScan}
              path="/phishing"
              color="blue"
            />
            <ModuleCard
              icon={Smartphone}
              title="Malware Scanner"
              status={modules.malware?.status}
              lastScan={modules.malware?.lastScan}
              path="/malware"
              color="red"
            />
            <ModuleCard
              icon={Lock}
              title="Breach Monitor"
              status={modules.breach?.status}
              lastScan={modules.breach?.lastScan}
              path="/breach"
              color="amber"
            />
            <ModuleCard
              icon={Wifi}
              title="Wi-Fi Scanner"
              status={modules.wifi?.status}
              lastScan={modules.wifi?.lastScan}
              path="/wifi"
              color="green"
            />
          </div>
        </motion.div>

        {/* Recent Alerts */}
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-semibold text-text-white mb-4">Recent Alerts</h2>
          {recentAlerts.length > 0 ? (
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <ThreatCard
                  key={alert._id}
                  type={alert.type}
                  title={alert.title}
                  description={alert.description}
                  timestamp={alert.createdAt}
                  module={alert.module}
                />
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <Shield className="w-12 h-12 text-safe mx-auto mb-3" />
              <p className="text-text-muted">No alerts. Your device looks secure!</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
