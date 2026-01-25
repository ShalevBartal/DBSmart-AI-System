import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SystemConfig } from '../../types';

interface ConfigState {
  configs: SystemConfig[];
  selectedConfig: SystemConfig | null;
  loading: boolean;
  error: string | null;
}

const initialState: ConfigState = {
  configs: [],
  selectedConfig: null,
  loading: false,
  error: null,
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setConfigs: (state, action: PayloadAction<SystemConfig[]>) => {
      state.configs = action.payload;
      state.loading = false;
    },
    setSelectedConfig: (state, action: PayloadAction<SystemConfig | null>) => {
      state.selectedConfig = action.payload;
    },
    updateConfig: (state, action: PayloadAction<SystemConfig>) => {
      const index = state.configs.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.configs[index] = action.payload;
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
  setConfigs,
  setSelectedConfig,
  updateConfig,
  setLoading,
  setError,
} = configSlice.actions;

export default configSlice.reducer;
