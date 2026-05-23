import { createSlice } from '@reduxjs/toolkit';

/**
 * Settings Slice — persisted user preferences
 * Syncs to localStorage on every change.
 */
const loadSetting = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    return stored !== null ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    realTimeAlerts: loadSetting('cg_realTimeAlerts', true),
    clipboardScanner: loadSetting('cg_clipboardScanner', false),
    scanFrequency: localStorage.getItem('cg_scanFrequency') || 'Daily',
  },
  reducers: {
    toggleRealTimeAlerts: (state) => {
      state.realTimeAlerts = !state.realTimeAlerts;
      localStorage.setItem('cg_realTimeAlerts', JSON.stringify(state.realTimeAlerts));
    },
    toggleClipboardScanner: (state) => {
      state.clipboardScanner = !state.clipboardScanner;
      localStorage.setItem('cg_clipboardScanner', JSON.stringify(state.clipboardScanner));
    },
    setScanFrequency: (state, action) => {
      state.scanFrequency = action.payload;
      localStorage.setItem('cg_scanFrequency', action.payload);
    },
  },
});

export const {
  toggleRealTimeAlerts,
  toggleClipboardScanner,
  setScanFrequency,
} = settingsSlice.actions;

export default settingsSlice.reducer;
