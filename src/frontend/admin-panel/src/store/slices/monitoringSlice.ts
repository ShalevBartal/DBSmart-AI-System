import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SystemHealthMetrics, JobHistory, GraphRAGPerformanceMetrics } from '../../types';

interface MonitoringState {
  systemHealth: SystemHealthMetrics | null;
  recentJobs: JobHistory[];
  graphRAGMetrics: GraphRAGPerformanceMetrics[];
  loading: boolean;
  error: string | null;
}

const initialState: MonitoringState = {
  systemHealth: null,
  recentJobs: [],
  graphRAGMetrics: [],
  loading: false,
  error: null,
};

const monitoringSlice = createSlice({
  name: 'monitoring',
  initialState,
  reducers: {
    setSystemHealth: (state, action: PayloadAction<SystemHealthMetrics>) => {
      state.systemHealth = action.payload;
      state.loading = false;
    },
    setRecentJobs: (state, action: PayloadAction<JobHistory[]>) => {
      state.recentJobs = action.payload;
    },
    setGraphRAGMetrics: (state, action: PayloadAction<GraphRAGPerformanceMetrics[]>) => {
      state.graphRAGMetrics = action.payload;
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
  setSystemHealth,
  setRecentJobs,
  setGraphRAGMetrics,
  setLoading,
  setError,
} = monitoringSlice.actions;

export default monitoringSlice.reducer;
