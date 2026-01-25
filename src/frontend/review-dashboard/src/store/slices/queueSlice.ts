import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ReviewQueueDashboardView } from '../../types';

interface QueueState {
  items: ReviewQueueDashboardView[];
  selectedItem: ReviewQueueDashboardView | null;
  loading: boolean;
  error: string | null;
  filters: {
    status?: string;
    priority?: string;
    customer?: string;
  };
  sortBy: 'confidence' | 'severity' | 'date' | 'customer';
  sortOrder: 'asc' | 'desc';
}

const initialState: QueueState = {
  items: [],
  selectedItem: null,
  loading: false,
  error: null,
  filters: {},
  sortBy: 'date',
  sortOrder: 'desc',
};

const queueSlice = createSlice({
  name: 'queue',
  initialState,
  reducers: {
    setQueueItems: (state, action: PayloadAction<ReviewQueueDashboardView[]>) => {
      state.items = action.payload;
      state.loading = false;
    },
    setSelectedItem: (state, action: PayloadAction<ReviewQueueDashboardView | null>) => {
      state.selectedItem = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setFilters: (state, action: PayloadAction<QueueState['filters']>) => {
      state.filters = action.payload;
    },
    setSorting: (state, action: PayloadAction<{ sortBy: QueueState['sortBy']; sortOrder: QueueState['sortOrder'] }>) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },
    updateQueueItemStatus: (state, action: PayloadAction<{ id: number; status: string }>) => {
      const item = state.items.find(i => i.id === action.payload.id);
      if (item) {
        item.queueStatus = action.payload.status as any;
      }
    },
  },
});

export const {
  setQueueItems,
  setSelectedItem,
  setLoading,
  setError,
  setFilters,
  setSorting,
  updateQueueItemStatus,
} = queueSlice.actions;

export default queueSlice.reducer;
