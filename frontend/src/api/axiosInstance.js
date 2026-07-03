// src/api/axiosInstance.js
import axios from 'axios';

// In production (Vercel), VITE_API_BASE_URL should be set to
// "https://build-beyond.onrender.com" so cookies go directly to Render.
// In local dev, leave it empty to use Vite's proxy.
const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://build-beyond.onrender.com' : '');

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

export default axiosInstance;
