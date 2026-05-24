import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * CyberGuard AI — RTK Query API Definition
 * Single source of truth for all server state.
 * Replaces all individual api/*.js files.
 */
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  tagTypes: [
    'SecurityScore',
    'DashboardStats',
    'MalwareScan',
    'PhishingHistory',
    'WifiHistory',
    'BreachHistory',
    'Alerts',
  ],
  endpoints: (builder) => ({

    // ========================
    // Dashboard
    // ========================
    getSecurityScore: builder.query({
      query: () => '/dashboard/score',
      providesTags: ['SecurityScore'],
      // Auto-refresh every 30 seconds
      pollingInterval: undefined, // Controlled at component level
      transformResponse: (response) => response.data,
    }),

    getDashboardStats: builder.query({
      query: () => '/dashboard/stats',
      providesTags: ['DashboardStats'],
      transformResponse: (response) => response.data,
    }),

    clearAllScans: builder.mutation({
      query: () => ({
        url: '/scans/all',
        method: 'DELETE',
      }),
      invalidatesTags: [
        'SecurityScore',
        'DashboardStats',
        'MalwareScan',
        'PhishingHistory',
        'WifiHistory',
        'BreachHistory',
        'Alerts',
      ],
    }),

    healthCheck: builder.query({
      query: () => '/health',
    }),

    // ========================
    // Malware / Device Scanner
    // ========================
    scanMalware: builder.mutation({
      query: (permissions) => ({
        url: '/malware/scan',
        method: 'POST',
        body: { permissions },
      }),
      invalidatesTags: ['SecurityScore', 'DashboardStats', 'Alerts', 'MalwareScan'],
      transformResponse: (response) => response.data,
    }),

    getMalwareApps: builder.query({
      query: () => '/malware/apps',
      providesTags: ['MalwareScan'],
      transformResponse: (response) => response.data,
    }),

    clearMalwareHistory: builder.mutation({
      query: () => ({
        url: '/malware/history',
        method: 'DELETE',
      }),
      invalidatesTags: ['MalwareScan', 'SecurityScore', 'DashboardStats'],
    }),

    // ========================
    // Phishing Scanner
    // ========================
    scanPhishing: builder.mutation({
      query: (input) => ({
        url: '/phishing/scan',
        method: 'POST',
        body: { input },
      }),
      invalidatesTags: ['SecurityScore', 'DashboardStats', 'PhishingHistory', 'Alerts'],
      transformResponse: (response) => response.data,
    }),

    getPhishingHistory: builder.query({
      query: () => '/phishing/history',
      providesTags: ['PhishingHistory'],
      transformResponse: (response) => response.data,
    }),

    clearPhishingHistory: builder.mutation({
      query: () => ({
        url: '/phishing/history',
        method: 'DELETE',
      }),
      invalidatesTags: ['PhishingHistory', 'SecurityScore', 'DashboardStats'],
    }),

    // ========================
    // WiFi Scanner
    // ========================
    analyzeWifi: builder.mutation({
      query: (data) => ({
        url: '/wifi/analyze',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['SecurityScore', 'DashboardStats', 'WifiHistory', 'Alerts'],
      transformResponse: (response) => response.data,
    }),

    autoScanWifi: builder.mutation({
      query: ({ wifiPermission } = {}) => ({
        url: '/wifi/auto-scan',
        method: 'POST',
        body: { wifiPermission },
      }),
      invalidatesTags: ['SecurityScore', 'DashboardStats', 'WifiHistory', 'Alerts'],
      transformResponse: (response) => response.data,
    }),

    getWifiHistory: builder.query({
      query: () => '/wifi/history',
      providesTags: ['WifiHistory'],
      transformResponse: (response) => response.data,
    }),

    clearWifiHistory: builder.mutation({
      query: () => ({
        url: '/wifi/history',
        method: 'DELETE',
      }),
      invalidatesTags: ['WifiHistory', 'SecurityScore', 'DashboardStats'],
    }),

    // ========================
    // Breach Monitor
    // ========================
    checkBreach: builder.mutation({
      query: ({ input, type }) => ({
        url: '/breach/check',
        method: 'POST',
        body: { input, type },
      }),
      invalidatesTags: ['SecurityScore', 'DashboardStats', 'BreachHistory', 'Alerts'],
      transformResponse: (response) => response.data,
    }),

    getBreachHistory: builder.query({
      query: () => '/breach/history',
      providesTags: ['BreachHistory'],
      transformResponse: (response) => response.data,
    }),

    clearBreachHistory: builder.mutation({
      query: () => ({
        url: '/breach/history',
        method: 'DELETE',
      }),
      invalidatesTags: ['BreachHistory', 'SecurityScore', 'DashboardStats'],
    }),

    // ========================
    // Alerts
    // ========================
    getAlerts: builder.query({
      query: (type) => {
        const params = type && type !== 'All' ? `?type=${type}` : '';
        return `/alerts${params}`;
      },
      providesTags: ['Alerts'],
      transformResponse: (response) => response.data,
    }),

    markAlertAsRead: builder.mutation({
      query: (id) => ({
        url: `/alerts/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Alerts', 'SecurityScore'],
    }),

    deleteAlert: builder.mutation({
      query: (id) => ({
        url: `/alerts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Alerts'],
    }),

    markAllAlertsAsRead: builder.mutation({
      query: () => ({
        url: '/alerts/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: ['Alerts', 'SecurityScore'],
    }),

    deleteAllAlerts: builder.mutation({
      query: () => ({
        url: '/alerts/all',
        method: 'DELETE',
      }),
      invalidatesTags: ['Alerts'],
    }),

    // ========================
    // Password Strength
    // ========================
    checkPasswordStrength: builder.mutation({
      query: (password) => ({
        url: '/password/check',
        method: 'POST',
        body: { password },
      }),
      transformResponse: (response) => response.data,
    }),
  }),
});

// Export auto-generated hooks
export const {
  // Dashboard
  useGetSecurityScoreQuery,
  useGetDashboardStatsQuery,
  useClearAllScansMutation,
  useHealthCheckQuery,
  // Malware / Device Scanner
  useScanMalwareMutation,
  useGetMalwareAppsQuery,
  useClearMalwareHistoryMutation,
  // Phishing
  useScanPhishingMutation,
  useGetPhishingHistoryQuery,
  useClearPhishingHistoryMutation,
  // WiFi
  useAnalyzeWifiMutation,
  useAutoScanWifiMutation,
  useGetWifiHistoryQuery,
  useClearWifiHistoryMutation,
  // Breach
  useCheckBreachMutation,
  useGetBreachHistoryQuery,
  useClearBreachHistoryMutation,
  // Alerts
  useGetAlertsQuery,
  useMarkAlertAsReadMutation,
  useDeleteAlertMutation,
  useMarkAllAlertsAsReadMutation,
  useDeleteAllAlertsMutation,
  // Password
  useCheckPasswordStrengthMutation,
} = apiSlice;
