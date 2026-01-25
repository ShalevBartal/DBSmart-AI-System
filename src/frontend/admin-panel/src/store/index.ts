import { configureStore } from '@reduxjs/toolkit';
import configReducer from './slices/configSlice';
import monitoringReducer from './slices/monitoringSlice';
import userReducer from './slices/userSlice';
import alertsReducer from './slices/alertsSlice';

export const store = configureStore({
  reducer: {
    config: configReducer,
    monitoring: monitoringReducer,
    user: userReducer,
    alerts: alertsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
