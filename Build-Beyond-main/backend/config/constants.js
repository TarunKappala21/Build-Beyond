require('dotenv').config();

const parseOrigins = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const FRONTEND_ORIGINS = [
  ...parseOrigins(process.env.FRONTEND_URL),
  ...parseOrigins(process.env.FRONTEND_URLS),
];

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET,
  MONGO_URI: process.env.MONGO_URI,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ADMIN_PASSKEY: process.env.ADMIN_PASSKEY,
  PLATFORM_MANAGER_EMAIL: process.env.PLATFORM_MANAGER_EMAIL,
  PLATFORM_MANAGER_PASSWORD: process.env.PLATFORM_MANAGER_PASSWORD,
  PLATFORM_MANAGER_PASSKEY: process.env.PLATFORM_MANAGER_PASSKEY,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  FRONTEND_ORIGINS: FRONTEND_ORIGINS.length
    ? Array.from(new Set(FRONTEND_ORIGINS))
    : ['http://localhost:5173'],
  REDIS_URL: process.env.REDIS_URL,
  REDIS_ENABLED: process.env.REDIS_ENABLED || 'true',
  REDIS_DEFAULT_TTL_SECONDS: Number(process.env.REDIS_DEFAULT_TTL_SECONDS || 120),
  REDIS_CACHE_LOG_EVERY_N: Number(process.env.REDIS_CACHE_LOG_EVERY_N || 0),
  parseOrigins,
};