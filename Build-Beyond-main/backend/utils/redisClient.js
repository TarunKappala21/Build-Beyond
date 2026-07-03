const { createClient } = require('redis');
const { REDIS_URL, REDIS_ENABLED } = require('../config/constants');

let client = null;
let redisReady = false;

const isRedisEnabled = () => REDIS_ENABLED !== 'false';

const initRedis = async () => {
  if (!isRedisEnabled()) {
    console.log('Redis disabled via REDIS_ENABLED=false');
    return null;
  }

  if (client) return client;

  const redisHost = process.env.REDIS_HOST;
  const redisPort = Number(process.env.REDIS_PORT || 0);
  const redisUsername = process.env.REDIS_USERNAME;
  const redisPassword = process.env.REDIS_PASSWORD;

  if (REDIS_URL) {
    client = createClient({ url: REDIS_URL });
  } else if (redisHost && redisPort) {
    client = createClient({
      username: redisUsername,
      password: redisPassword,
      socket: {
        host: redisHost,
        port: redisPort,
      },
    });
  } else {
    console.log('Redis not configured (set REDIS_URL or REDIS_HOST/REDIS_PORT); continuing without cache');
    return null;
  }

  client.on('error', (error) => {
    redisReady = false;
    console.error('Redis error:', error.message);
  });

  client.on('ready', () => {
    redisReady = true;
    console.log('Redis connected');
  });

  client.on('end', () => {
    redisReady = false;
    console.log('Redis connection closed');
  });

  try {
    await client.connect();
  } catch (error) {
    redisReady = false;
    console.error('Failed to connect Redis; continuing without cache:', error.message);
  }

  return client;
};

const getRedisClient = () => (redisReady && client ? client : null);

module.exports = {
  initRedis,
  getRedisClient,
};
