import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Alert, AlertConfig } from '../../types';

interface AlertsState {
  alerts: Alert[];
  alertConfigs: AlertConfig[];
  unacknowledgedCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: AlertsState = {
  alerts: [],
  alertConfigs: [],
  unacknowledgedCount: 0,
  loading: false,
  error: null,
};

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    setAlerts: (state, action: PayloadAction<Alert[]>) => {
      state.alerts = action.payload;
      state.unacknowledgedCount = action.payload.filter(a => !a.acknowledged).length;
      state.loading = false;
    },
    setAlertConfigs: (state, action: PayloadAction<AlertConfig[]>) => {
      state.alertConfigs = action.payload;
    },
    acknowledgeAlert: (state, action: PayloadAction<number>) => {
      const alert = state.alerts.find(a => a.id === action.payload);
      if (alert) {
        alert.acknowledged = true;
        state.unacknowledgedCount--;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setAlerts,
  setAlertConfigs,
  acknowledgeAlert,
  setLoading,
  setError,
} = alertsSlice.actions;

export default alertsSlice.reducer;
