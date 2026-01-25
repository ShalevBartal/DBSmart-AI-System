import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Analysis } from '../../types';

interface AnalysisState {
  currentAnalysis: Analysis | null;
  editedAnalysis: Analysis | null;
  isEditing: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AnalysisState = {
  currentAnalysis: null,
  editedAnalysis: null,
  isEditing: false,
  loading: false,
  error: null,
};

const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    setCurrentAnalysis: (state, action: PayloadAction<Analysis | null>) => {
      state.currentAnalysis = action.payload;
      state.editedAnalysis = action.payload ? { ...action.payload } : null;
      state.loading = false;
    },
    setEditedAnalysis: (state, action: PayloadAction<Analysis>) => {
      state.editedAnalysis = action.payload;
    },
    setIsEditing: (state, action: PayloadAction<boolean>) => {
      state.isEditing = action.payload;
    },
    updateEditedField: (state, action: PayloadAction<{ field: keyof Analysis; value: any }>) => {
      if (state.editedAnalysis) {
        (state.editedAnalysis as any)[action.payload.field] = action.payload.value;
      }
    },
    resetEdits: (state) => {
      state.editedAnalysis = state.currentAnalysis ? { ...state.currentAnalysis } : null;
      state.isEditing = false;
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
  setCurrentAnalysis,
  setEditedAnalysis,
  setIsEditing,
  updateEditedField,
  resetEdits,
  setLoading,
  setError,
} = analysisSlice.actions;

export default analysisSlice.reducer;
