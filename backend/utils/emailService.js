const nodemailer = require('nodemailer');

let transporter = null;

const envBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
  return fallback;
};

const envNum = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getSmtpConfig = () => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
    SMTP_REQUIRE_TLS,
    SMTP_TLS_REJECT_UNAUTHORIZED,
    SMTP_CONNECTION_TIMEOUT_MS,
    SMTP_GREETING_TIMEOUT_MS,
    SMTP_SOCKET_TIMEOUT_MS,
  } = process.env;

  return {
    host: SMTP_HOST,
    port: envNum(SMTP_PORT, 587),
    secure: envBool(SMTP_SECURE, false),
    user: SMTP_USER,
    pass: SMTP_PASS,
    from: SMTP_FROM,
    requireTLS: envBool(SMTP_REQUIRE_TLS, false),
    tlsRejectUnauthorized: envBool(SMTP_TLS_REJECT_UNAUTHORIZED, true),
    connectionTimeoutMs: envNum(SMTP_CONNECTION_TIMEOUT_MS, 20000),
    greetingTimeoutMs: envNum(SMTP_GREETING_TIMEOUT_MS, 10000),
    socketTimeoutMs: envNum(SMTP_SOCKET_TIMEOUT_MS, 30000),
  };
};

const getFromAddress = (smtpConfig) => {
  const configured = smtpConfig.from;
  if (configured && String(configured).trim()) return configured;
  return smtpConfig.user;
};

const getTransporter = () => {
  if (transporter) return transporter;

  const smtpConfig = getSmtpConfig();

  if (!smtpConfig.host || !smtpConfig.port || !smtpConfig.user || !smtpConfig.pass) {
    throw new Error('SMTP configuration is missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS.');
  }

  transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    requireTLS: smtpConfig.requireTLS,
    connectionTimeout: smtpConfig.connectionTimeoutMs,
    greetingTimeout: smtpConfig.greetingTimeoutMs,
    socketTimeout: smtpConfig.socketTimeoutMs,
    tls: {
      rejectUnauthorized: smtpConfig.tlsRejectUnauthorized,
    },
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
  });

  return transporter;
};

const verifySmtpConnection = async () => {
  const mailer = getTransporter();
  await mailer.verify();
  return true;
};

const sendOtpEmail = async ({ to, otp, purpose }) => {
  const mailer = getTransporter();
  const smtpConfig = getSmtpConfig();
  const appName = 'Build & Beyond';
  const subject =
    purpose === 'signup'
      ? `${appName} email verification OTP`
      : purpose === 'login-2fa'
      ? `${appName} login verification OTP`
      : `${appName} password reset OTP`;

  try {
    await mailer.sendMail({
      from: getFromAddress(smtpConfig),
      to,
      subject,
      text: `Your OTP is ${otp}. It is valid for 10 minutes. If you did not request this, please ignore this email.`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#222;">
          <h2 style="margin:0 0 12px;">${appName}</h2>
          <p>Your one-time password is:</p>
          <p style="font-size:24px;font-weight:700;letter-spacing:4px;margin:8px 0 16px;">${otp}</p>
          <p>This code is valid for 10 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    throw new Error(`Failed to send OTP email via SMTP: ${error.message}`);
  }
};

module.exports = { sendOtpEmail, verifySmtpConnection };
