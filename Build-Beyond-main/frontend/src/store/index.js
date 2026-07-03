import { configureStore } from '@reduxjs/toolkit';
import customerProfileReducer from './slices/customerProfileSlice';

const store = configureStore({
  reducer: {
    customerProfile: customerProfileReducer,
  },
});

export default store;
