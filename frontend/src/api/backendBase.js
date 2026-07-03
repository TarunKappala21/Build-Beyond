const backendBase =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? "https://build-beyond.onrender.com" : "");

export default backendBase;