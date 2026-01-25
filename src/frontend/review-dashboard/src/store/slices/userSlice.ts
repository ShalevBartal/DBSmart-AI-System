import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserInfo } from '../../types';

interface UserState {
  userInfo: UserInfo | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  userInfo: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserInfo: (state, action: PayloadAction<UserInfo>) => {
      state.userInfo = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
    },
    clearUserInfo: (state) => {
      state.userInfo = null;
      state.isAuthenticated = false;
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
  setUserInfo,
  clearUserInfo,
  setLoading,
  setError,
} = userSlice.actions;

export default userSlice.reducer;
