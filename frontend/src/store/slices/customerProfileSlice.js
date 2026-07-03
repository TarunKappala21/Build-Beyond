import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

export const fetchCustomerProfile = createAsyncThunk(
  'customerProfile/fetchProfile',
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get('/api/customer/profile');
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || 'Error fetching profile');
    }
  }
);

const customerProfileSlice = createSlice({
  name: 'customerProfile',
  initialState: {
    name: '',
    email: '',
    phone: '',
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCustomerProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.name = action.payload.name || '';
        state.email = action.payload.email || '';
        state.phone = action.payload.phone || '';
      })
      .addCase(fetchCustomerProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to load profile';
      });
  },
});

export default customerProfileSlice.reducer;
