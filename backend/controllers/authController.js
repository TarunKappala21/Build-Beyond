const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');
const fs = require('fs');
const { JWT_SECRET } = require('../config/constants');
const { Customer, Company, Worker } = require('../models');
const EmailOtp = require('../models/emailOtpModel');
const { sendOtpEmail } = require('../utils/emailService');
const { autoAssignVerification } = require('./platformManagerController');
const upload = require('../middlewares/upload').upload; // Multer upload

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);
const OTP_RESEND_SECONDS = Number(process.env.OTP_RESEND_SECONDS || 30);
const LOGIN_2FA_TOKEN_MINUTES = Number(process.env.LOGIN_2FA_TOKEN_MINUTES || 10);
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleOAuthClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const isProduction = process.env.NODE_ENV === 'production';
// Use secure cross-origin cookie settings when on Render (HTTPS) or production.
// Render always sets RENDER=true in its environment.
const isSecureEnv = isProduction || process.env.RENDER === 'true';
const authCookieOptions = {
  httpOnly: true,
  secure: isSecureEnv,
  maxAge: 1000 * 60 * 60 * 24,
  sameSite: isSecureEnv ? 'none' : 'lax',
  path: '/',
};


const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizeRole = (role) => String(role || '').trim().toLowerCase();

const inferRoleFromModel = (user) => {
  const modelName = String(user?.constructor?.modelName || '').toLowerCase();
  if (modelName === 'customer') return 'customer';
  if (modelName === 'company') return 'company';
  if (modelName === 'worker') return 'worker';
  return null;
};

const resolveUserRole = (user) => {
  const directRole = normalizeRole(user?.role);
  if (['customer', 'company', 'worker'].includes(directRole)) return directRole;
  return inferRoleFromModel(user);
};

const getModelForRole = (role) => {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === 'customer') return Customer;
  if (normalizedRole === 'company') return Company;
  if (normalizedRole === 'worker') return Worker;
  return null;
};

const findUserByEmail = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  return (
    await Customer.findOne({ email: normalizedEmail }) ||
    await Company.findOne({ email: normalizedEmail }) ||
    await Worker.findOne({ email: normalizedEmail })
  );
};

const createOtpCode = () => `${Math.floor(100000 + Math.random() * 900000)}`;

const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

const getRedirectByRole = (role) => {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === 'customer') return '/customerdashboard';
  if (normalizedRole === 'company') return '/companydashboard';
  if (normalizedRole === 'worker') return '/workerdashboard';
  return null;
};

const setAuthCookie = (res, user) => {
  const resolvedRole = resolveUserRole(user);
  if (!resolvedRole) {
    throw new Error('User role is not configured for authentication');
  }

  const token = jwt.sign({ user_id: user._id.toString(), role: resolvedRole }, JWT_SECRET, { expiresIn: '1d' });
  res.cookie('token', token, authCookieOptions);
};

const upsertOtpRecord = async ({ email, purpose, otp }) => {
  const normalizedEmail = normalizeEmail(email);
  const existingOtp = await EmailOtp.findOne({ email: normalizedEmail, purpose });
  if (existingOtp?.lastSentAt) {
    const elapsedSeconds = Math.floor((Date.now() - new Date(existingOtp.lastSentAt).getTime()) / 1000);
    if (elapsedSeconds < OTP_RESEND_SECONDS) {
      return { limited: true, waitSeconds: OTP_RESEND_SECONDS - elapsedSeconds };
    }
  }

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const otpHash = hashOtp(otp);

  await EmailOtp.findOneAndUpdate(
    { email: normalizedEmail, purpose },
    {
      email: normalizedEmail,
      purpose,
      otpHash,
      expiresAt,
      lastSentAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return { limited: false };
};

const issueLoginTwoFactorChallenge = async (user) => {
  const otp = createOtpCode();
  const rateStatus = await upsertOtpRecord({ email: user.email, purpose: 'login-2fa', otp });
  if (rateStatus.limited) {
    return { ok: false, waitSeconds: rateStatus.waitSeconds };
  }

  await sendOtpEmail({ to: normalizeEmail(user.email), otp, purpose: 'login-2fa' });
  const twoFactorToken = jwt.sign(
    {
      type: 'login-2fa-challenge',
      user_id: user._id.toString(),
      role: user.role,
      email: normalizeEmail(user.email),
    },
    JWT_SECRET,
    { expiresIn: `${LOGIN_2FA_TOKEN_MINUTES}m` },
  );

  return { ok: true, twoFactorToken };
};

const signEmailVerificationToken = (email, purpose) =>
  jwt.sign(
    { email: normalizeEmail(email), purpose, type: 'email-otp-verified' },
    JWT_SECRET,
    { expiresIn: `${OTP_EXPIRY_MINUTES}m` },
  );

const verifyEmailVerificationToken = (token, email, purpose) => {
  if (!token) return false;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return (
      payload?.type === 'email-otp-verified' &&
      payload?.purpose === purpose &&
      payload?.email === normalizeEmail(email)
    );
  } catch (error) {
    return false;
  }
};

const sendEmailOtp = async (req, res) => {
  try {
    const { email, purpose } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) return res.status(400).json({ message: 'Email is required' });
    if (!['signup', 'forgot-password'].includes(purpose)) {
      return res.status(400).json({ message: 'Invalid OTP purpose' });
    }

    const user = await findUserByEmail(normalizedEmail);
    if (purpose === 'signup' && user) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    if (purpose === 'forgot-password' && !user) {
      return res.status(404).json({ message: 'Account with this email was not found' });
    }

    const otp = createOtpCode();
    const rateStatus = await upsertOtpRecord({ email: normalizedEmail, purpose, otp });
    if (rateStatus.limited) {
      return res.status(429).json({
        message: `Please wait ${rateStatus.waitSeconds}s before requesting a new OTP`,
      });
    }

    await sendOtpEmail({ to: normalizedEmail, otp, purpose });

    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('sendEmailOtp error:', error);
    res.status(500).json({ message: 'Unable to send OTP email right now' });
  }
};

const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const otpCode = String(otp || '').trim();

    if (!normalizedEmail || !otpCode || !purpose) {
      return res.status(400).json({ message: 'Email, purpose and OTP are required' });
    }

    const otpRecord = await EmailOtp.findOne({ email: normalizedEmail, purpose });
    if (!otpRecord) return res.status(400).json({ message: 'Please request OTP first' });
    if (new Date(otpRecord.expiresAt).getTime() < Date.now()) {
      await otpRecord.deleteOne();
      return res.status(400).json({ message: 'OTP expired. Request a new one.' });
    }

    if (otpRecord.otpHash !== hashOtp(otpCode)) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    await otpRecord.deleteOne();
    const verificationToken = signEmailVerificationToken(normalizedEmail, purpose);

    res.status(200).json({ message: 'OTP verified', verificationToken });
  } catch (error) {
    console.error('verifyEmailOtp error:', error);
    res.status(500).json({ message: 'Unable to verify OTP' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, verificationToken } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !newPassword || !verificationToken) {
      return res.status(400).json({ message: 'Email, new password and verification token are required' });
    }

    if (!verifyEmailVerificationToken(verificationToken, normalizedEmail, 'forgot-password')) {
      return res.status(401).json({ message: 'Password reset verification expired or invalid' });
    }

    const user = await findUserByEmail(normalizedEmail);
    if (!user) return res.status(404).json({ message: 'Account with this email was not found' });

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password cannot be same as current password' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(500).json({ message: 'Unable to reset password' });
  }
};
 
const signup = async (req, res) => {
  try {
    const { role, password, termsAccepted, emailVerificationToken, ...data } = req.body;
    if (!role) return res.status(400).json({ message: 'User type is required' });
    if (!password) return res.status(400).json({ message: 'Password is required' });
    if (!termsAccepted) return res.status(400).json({ message: 'You must accept the terms and conditions' });

    const email = normalizeEmail(data.email);
    if (!verifyEmailVerificationToken(emailVerificationToken, email, 'signup')) {
      return res.status(401).json({ message: 'Please verify your email with OTP before signup' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    let user;
    switch (role) {
      case 'customer':
        if (!data.name || !data.email || !data.dob || !data.phone) return res.status(400).json({ message: 'All customer fields are required' });
        user = new Customer({ name: data.name, email, dob: new Date(data.dob), phone: data.phone, password, role });
        break;
      case 'company':
        if (!data.companyName || !data.contactPerson || !data.email || !data.phone) return res.status(400).json({ message: 'All company fields are required' });
        user = new Company({ companyName: data.companyName, contactPerson: data.contactPerson, email, phone: data.phone, companyDocuments: req.files ? req.files.map(file => file.path) : [], password, role, status: 'pending' });
        break;
      case 'worker':
        if (!data.name || !data.email || !data.dob || !data.aadharNumber || !data.phone || !data.specialization) return res.status(400).json({ message: 'All worker fields are required' });
        user = new Worker({ name: data.name, email, dob: new Date(data.dob), aadharNumber: data.aadharNumber, phone: data.phone, specialization: data.specialization, experience: data.experience || 0, certificateFiles: req.files ? req.files.map(file => file.path) : [], isArchitect: data.specialization.toLowerCase() === 'architect', password, role, status: 'pending' });
        break;
      default:
        return res.status(400).json({ message: 'Invalid user type' });
    }

    await user.save();

    // Auto-assign verification task to platform manager
    if (role === 'company' || role === 'worker') {
      try {
        const entityName = role === 'company' ? user.companyName : user.name;
        await autoAssignVerification(role, user._id, entityName);
      } catch (error) {
        console.error('Error auto-assigning verification:', error);
        // Don't fail signup if assignment fails
      }
    }

    res.status(201).json({ message: 'Signup successful' });
  } catch (error) {
    if (error.code === 11000) res.status(400).json({ message: 'Email or Aadhaar number already exists' });
    else res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    let user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const userRole = resolveUserRole(user);
    if (!userRole) {
      return res.status(500).json({ message: 'Account role is not configured. Please contact support.' });
    }

    // Block login for company/worker if not verified
    if ((userRole === 'company' || userRole === 'worker')) {
      if (user.status === 'pending') {
        return res.status(403).json({ message: 'Your application is yet to be accepted', status: 'pending' });
      }
      if (user.status === 'rejected') {
        return res.status(403).json({ message: 'Your application has been rejected', status: 'rejected' });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    if (user.twoFactorEnabled) {
      const challenge = await issueLoginTwoFactorChallenge(user);
      if (!challenge.ok) {
        return res.status(429).json({
          message: `Please wait ${challenge.waitSeconds}s before requesting a new OTP`,
        });
      }

      return res.status(200).json({
        requiresTwoFactor: true,
        twoFactorToken: challenge.twoFactorToken,
        email: normalizeEmail(user.email),
        message: 'OTP sent to your registered email',
      });
    }

    setAuthCookie(res, user);
    const redirect = getRedirectByRole(userRole);
    if (!redirect) return res.status(500).json({ message: 'Server error' });

    res.status(200).json({ message: 'Login successful', redirect });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const loginWithGoogle = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'Google credential is required' });

    if (!googleOAuthClient || !GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Google login is not configured on server' });
    }

    const ticket = await googleOAuthClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = normalizeEmail(payload?.email);
    if (!email || !payload?.email_verified) {
      return res.status(401).json({ message: 'Google account email is not verified' });
    }

    let user = await findUserByEmail(email);

    // If no account exists, reject login and ask user to sign up first
    if (!user) {
      return res.status(404).json({
        message: 'Account not found. Please sign up first using the Sign Up tab.',
        accountExists: false,
      });
    }

    const userRole = resolveUserRole(user);
    if (!userRole) {
      return res.status(500).json({ message: 'Account role is not configured. Please contact support.' });
    }

    if ((userRole === 'company' || userRole === 'worker')) {
      if (user.status === 'pending') {
        return res.status(403).json({ message: 'Your application is yet to be accepted', status: 'pending' });
      }
      if (user.status === 'rejected') {
        return res.status(403).json({ message: 'Your application has been rejected', status: 'rejected' });
      }
    }

    if (user.twoFactorEnabled) {
      const challenge = await issueLoginTwoFactorChallenge(user);
      if (!challenge.ok) {
        return res.status(429).json({
          message: `Please wait ${challenge.waitSeconds}s before requesting a new OTP`,
        });
      }

      return res.status(200).json({
        requiresTwoFactor: true,
        twoFactorToken: challenge.twoFactorToken,
        email: normalizeEmail(user.email),
        message: 'OTP sent to your registered email',
      });
    }

    setAuthCookie(res, user);
    const redirect = getRedirectByRole(userRole);
    if (!redirect) return res.status(500).json({ message: 'Server error' });

    return res.status(200).json({ message: 'Login successful', redirect });
  } catch (error) {
    console.error('loginWithGoogle error:', error);
    return res.status(401).json({ message: 'Google login failed' });
  }
};

const verifyLoginTwoFactor = async (req, res) => {
  try {
    const { email, otp, twoFactorToken } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const otpCode = String(otp || '').trim();

    if (!normalizedEmail || !otpCode || !twoFactorToken) {
      return res.status(400).json({ message: 'Email, OTP and two-factor token are required' });
    }

    let payload;
    try {
      payload = jwt.verify(twoFactorToken, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: 'Two-factor session expired. Please login again.' });
    }

    if (payload?.type !== 'login-2fa-challenge' || payload?.email !== normalizedEmail) {
      return res.status(401).json({ message: 'Invalid two-factor session' });
    }

    const otpRecord = await EmailOtp.findOne({ email: normalizedEmail, purpose: 'login-2fa' });
    if (!otpRecord) return res.status(400).json({ message: 'Please request OTP first' });
    if (new Date(otpRecord.expiresAt).getTime() < Date.now()) {
      await otpRecord.deleteOne();
      return res.status(400).json({ message: 'OTP expired. Request a new one.' });
    }

    if (otpRecord.otpHash !== hashOtp(otpCode)) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    await otpRecord.deleteOne();
    const Model = getModelForRole(payload.role);
    if (!Model) return res.status(400).json({ message: 'Invalid user role' });
    const user = await Model.findById(payload.user_id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const userRole = resolveUserRole(user);
    if (!userRole) {
      return res.status(500).json({ message: 'Account role is not configured. Please contact support.' });
    }

    setAuthCookie(res, user);
    const redirect = getRedirectByRole(userRole);
    if (!redirect) return res.status(500).json({ message: 'Server error' });

    res.status(200).json({ message: 'Login successful', redirect });
  } catch (error) {
    console.error('verifyLoginTwoFactor error:', error);
    res.status(500).json({ message: 'Unable to verify OTP' });
  }
};

const resendLoginTwoFactor = async (req, res) => {
  try {
    const { twoFactorToken } = req.body;
    if (!twoFactorToken) return res.status(400).json({ message: 'Two-factor token is required' });

    let payload;
    try {
      payload = jwt.verify(twoFactorToken, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: 'Two-factor session expired. Please login again.' });
    }

    if (payload?.type !== 'login-2fa-challenge') {
      return res.status(401).json({ message: 'Invalid two-factor session' });
    }

    const Model = getModelForRole(payload.role);
    if (!Model) return res.status(400).json({ message: 'Invalid user role' });
    const user = await Model.findById(payload.user_id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const challenge = await issueLoginTwoFactorChallenge(user);
    if (!challenge.ok) {
      return res.status(429).json({ message: `Please wait ${challenge.waitSeconds}s before requesting a new OTP` });
    }

    res.status(200).json({
      message: 'OTP sent to your registered email',
      twoFactorToken: challenge.twoFactorToken,
    });
  } catch (error) {
    console.error('resendLoginTwoFactor error:', error);
    res.status(500).json({ message: 'Unable to resend OTP' });
  }
};

const getTwoFactorStatus = async (req, res) => {
  try {
    const Model = getModelForRole(req.user.role);
    if (!Model) return res.status(400).json({ message: 'Invalid user role' });

    const user = await Model.findById(req.user.user_id).select('twoFactorEnabled');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ twoFactorEnabled: Boolean(user.twoFactorEnabled) });
  } catch (error) {
    console.error('getTwoFactorStatus error:', error);
    res.status(500).json({ message: 'Unable to get two-factor setting' });
  }
};

const updateTwoFactorStatus = async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'enabled must be true or false' });
    }

    const Model = getModelForRole(req.user.role);
    if (!Model) return res.status(400).json({ message: 'Invalid user role' });

    const user = await Model.findById(req.user.user_id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.twoFactorEnabled = enabled;
    await user.save();

    res.status(200).json({ message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'}` });
  } catch (error) {
    console.error('updateTwoFactorStatus error:', error);
    res.status(500).json({ message: 'Unable to update two-factor setting' });
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logout successful' });
};

const getSession = (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(200).json({ authenticated: false });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.status(200).json({ authenticated: true, user: { user_id: decoded.user_id, role: decoded.role } });
  } catch (error) {
    res.status(200).json({ authenticated: false });
  }
};

module.exports = {
  signup,
  login,
  loginWithGoogle,
  verifyLoginTwoFactor,
  resendLoginTwoFactor,
  logout,
  getSession,
  sendEmailOtp,
  verifyEmailOtp,
  resetPassword,
  getTwoFactorStatus,
  updateTwoFactorStatus,
};