import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './api/apiSlice';
import scannerReducer from './slices/scannerSlice';
import settingsReducer from './slices/settingsSlice';
import alertsReducer from './slices/alertsSlice';

/**
 * CyberGuard AI — Redux Store
 * Single source of truth for all application state.
 */
const store = configureStore({
  reducer: {
    // RTK Query API reducer (handles all server state + caching)
    [apiSlice.reducerPath]: apiSlice.reducer,
    // Client-side UI slices
    scanner: scannerReducer,
    settings: settingsReducer,
    alerts: alertsReducer,
  },
  // RTK Query middleware for caching, invalidation, polling
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
