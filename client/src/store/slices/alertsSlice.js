import { createSlice } from '@reduxjs/toolkit';

/**
 * Alerts Slice — manages alerts page UI state
 */
const alertsSlice = createSlice({
  name: 'alerts',
  initialState: {
    activeFilter: 'All',
    expandedAlert: null,
  },
  reducers: {
    setFilter: (state, action) => {
      state.activeFilter = action.payload;
    },
    toggleExpandAlert: (state, action) => {
      state.expandedAlert = state.expandedAlert === action.payload ? null : action.payload;
    },
    collapseAlert: (state) => {
      state.expandedAlert = null;
    },
  },
});

export const { setFilter, toggleExpandAlert, collapseAlert } = alertsSlice.actions;
export default alertsSlice.reducer;
