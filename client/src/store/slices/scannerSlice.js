import { createSlice } from '@reduxjs/toolkit';

/**
 * Scanner Slice — manages Device Scanner UI state
 */
const scannerSlice = createSlice({
  name: 'scanner',
  initialState: {
    isScanning: false,
    scanProgress: 0,
    scanStage: '',
    scanResults: null,
    expandedCategories: {},
  },
  reducers: {
    startScan: (state) => {
      state.isScanning = true;
      state.scanProgress = 0;
      state.scanStage = 'Initializing...';
    },
    updateProgress: (state, action) => {
      state.scanProgress = action.payload.progress;
      state.scanStage = action.payload.stage;
    },
    completeScan: (state, action) => {
      state.isScanning = false;
      state.scanProgress = 100;
      state.scanStage = 'Complete';
      state.scanResults = action.payload;
    },
    failScan: (state) => {
      state.isScanning = false;
      state.scanProgress = 0;
      state.scanStage = '';
    },
    toggleCategory: (state, action) => {
      const category = action.payload;
      state.expandedCategories[category] = !state.expandedCategories[category];
    },
    clearResults: (state) => {
      state.scanResults = null;
      state.expandedCategories = {};
    },
  },
});

export const {
  startScan,
  updateProgress,
  completeScan,
  failScan,
  toggleCategory,
  clearResults,
} = scannerSlice.actions;

export default scannerSlice.reducer;
