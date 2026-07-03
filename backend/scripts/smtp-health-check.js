require('dotenv').config();

const { verifySmtpConnection } = require('../utils/emailService');

const mask = (value) => {
  if (!value) return 'not-set';
  if (value.length <= 4) return '****';
  return `${value.slice(0, 2)}****${value.slice(-2)}`;
};

const main = async () => {
  console.log('[smtp-check] Starting SMTP verification');
  console.log('[smtp-check] Host:', process.env.SMTP_HOST || 'not-set');
  console.log('[smtp-check] Port:', process.env.SMTP_PORT || 'not-set');
  console.log('[smtp-check] Secure:', process.env.SMTP_SECURE || 'not-set');
  console.log('[smtp-check] User:', mask(process.env.SMTP_USER || ''));
  console.log('[smtp-check] RequireTLS:', process.env.SMTP_REQUIRE_TLS || 'not-set');
  console.log(
    '[smtp-check] TLS rejectUnauthorized:',
    process.env.SMTP_TLS_REJECT_UNAUTHORIZED || 'not-set',
  );

  await verifySmtpConnection();
  console.log('[smtp-check] SMTP verify succeeded');
};

main().catch((error) => {
  console.error('[smtp-check] SMTP verify failed:', error.message);
  process.exit(1);
});
