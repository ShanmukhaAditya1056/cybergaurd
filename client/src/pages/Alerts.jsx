import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Trash2, Check, AlertTriangle, CheckCircle, XCircle, Info, Shield, ExternalLink } from 'lucide-react';
import { useGetAlertsQuery, useMarkAlertAsReadMutation, useDeleteAlertMutation } from '../store/api/apiSlice';
import { setFilter, toggleExpandAlert } from '../store/slices/alertsSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20 }
};

const FILTER_TYPES = ['All', 'CRITICAL', 'WARNING', 'SAFE', 'INFO'];

// Map module names to routes
const MODULE_ROUTES = {
  'Phishing Scanner': '/phishing',
  'Device Scanner': '/malware',
  'WiFi Scanner': '/wifi',
  'Breach Monitor': '/breach',
  'Malware Scanner': '/malware',
};

const Alerts = () => {
  const dispatch = useDispatch();
  const { activeFilter, expandedAlert } = useSelector((state) => state.alerts);
  const navigate = useNavigate();

  const { data: alertsData, isLoading } = useGetAlertsQuery(activeFilter);

  const [triggerMarkRead] = useMarkAlertAsReadMutation();
  const [triggerDelete] = useDeleteAlertMutation();

  const handleMarkRead = async (id) => {
    try {
      await triggerMarkRead(id).unwrap();
      toast.success('Alert marked as read');
    } catch { /* silently fail */ }
  };

  const handleDelete = async (id) => {
    try {
      await triggerDelete(id).unwrap();
      toast.success('Alert deleted');
    } catch { /* silently fail */ }
  };

  if (isLoading) {
    return <LoadingSpinner fullPage text="Loading alerts..." />;
  }

  const alerts = alertsData ?? [];

  const getAlertIcon = (type) => {
    switch (type) {
      case 'CRITICAL': return <XCircle className="w-5 h-5 text-critical" />;
      case 'WARNING': return <AlertTriangle className="w-5 h-5 text-warn" />;
      case 'SAFE': return <CheckCircle className="w-5 h-5 text-safe" />;
      case 'INFO': return <Info className="w-5 h-5 text-blue-accent" />;
      default: return <Bell className="w-5 h-5 text-text-dim" />;
    }
  };

  const getAlertBg = (type) => {
    switch (type) {
      case 'CRITICAL': return 'border-critical/20 bg-critical-bg/30';
      case 'WARNING': return 'border-warn/20 bg-warn-bg/30';
      case 'SAFE': return 'border-safe/20 bg-safe-bg/30';
      case 'INFO': return 'border-blue-accent/20 bg-blue-accent/5';
      default: return 'border-navy-border bg-navy-card';
    }
  };

  const getAlertBadge = (type) => {
    switch (type) {
      case 'CRITICAL': return 'bg-critical/20 text-critical';
      case 'WARNING': return 'bg-warn/20 text-warn';
      case 'SAFE': return 'bg-safe/20 text-safe';
      case 'INFO': return 'bg-blue-accent/20 text-blue-accent';
      default: return 'bg-navy-border text-text-dim';
    }
  };

  const getFilterColor = (type) => {
    switch (type) {
      case 'CRITICAL': return 'border-critical text-critical bg-critical/10';
      case 'WARNING': return 'border-warn text-warn bg-warn/10';
      case 'SAFE': return 'border-safe text-safe bg-safe/10';
      case 'INFO': return 'border-blue-accent text-blue-accent bg-blue-accent/10';
      default: return 'border-blue-accent text-blue-accent bg-blue-accent/10';
    }
  };

  const handleGoToModule = (module) => {
    const route = MODULE_ROUTES[module];
    if (route) {
      navigate(route);
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-navy pt-20 pb-10 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-accent/10 border border-blue-accent/30">
              <Bell className="w-6 h-6 text-blue-accent" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-white">Security Alerts</h1>
              <p className="text-text-muted text-sm">{alerts.length} alert{alerts.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 overflow-x-auto mobile-scroll pb-2">
          {FILTER_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => dispatch(setFilter(type))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border ${
                activeFilter === type
                  ? getFilterColor(type)
                  : 'border-navy-border text-text-muted hover:text-text-white bg-navy-card'
              }`}
            >
              {type === 'All' ? 'All Alerts' : type}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        {alerts.length > 0 ? (
          <div className="space-y-3">
            <AnimatePresence>
              {alerts.map((alert, index) => (
                <motion.div
                  key={alert._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-xl border p-4 transition-all ${getAlertBg(alert.type)} ${
                    alert.read ? 'opacity-60' : ''
                  }`}
                >
                  <div
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => dispatch(toggleExpandAlert(alert._id))}
                  >
                    <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`${getAlertBadge(alert.type)} px-2 py-0.5 rounded-full text-xs font-semibold`}>
                          {alert.type}
                        </span>
                        <span className="text-text-dim text-xs">{alert.module}</span>
                        {!alert.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-accent animate-pulse" />
                        )}
                      </div>
                      <h3 className="text-text-white text-sm font-medium">{alert.title}</h3>

                      {/* Expanded Content */}
                      <AnimatePresence>
                        {expandedAlert === alert._id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <p className="text-text-muted text-sm mt-2">{alert.description}</p>
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              {/* Go to module button */}
                              {MODULE_ROUTES[alert.module] && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGoToModule(alert.module);
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-accent text-white hover:bg-blue-600 transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Go to {alert.module}
                                </button>
                              )}
                              {!alert.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkRead(alert._id);
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-accent/10 text-blue-accent hover:bg-blue-accent/20 transition-colors"
                                >
                                  <Check className="w-3 h-3" />
                                  Mark as Read
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(alert._id);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {expandedAlert !== alert._id && (
                        <p className="text-text-muted text-xs mt-1 truncate">{alert.description}</p>
                      )}

                      <p className="text-text-dim text-xs mt-2">
                        {new Date(alert.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <Shield className="w-16 h-16 text-safe mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-white mb-2">All Clear!</h3>
            <p className="text-text-muted">No alerts to show. Your device is looking secure.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Alerts;
