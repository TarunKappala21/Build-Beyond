const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/authController');
const isAuthenticated = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');

router.post('/signup', upload.array('documents', 10), signup);
router.post('/login', login);
router.post('/login/google', loginWithGoogle);
router.post('/login/2fa/verify', verifyLoginTwoFactor);
router.post('/login/2fa/resend', resendLoginTwoFactor);
router.post('/email-otp/send', sendEmailOtp);
router.post('/email-otp/verify', verifyEmailOtp);
router.post('/reset-password', resetPassword);
router.get('/2fa/status', isAuthenticated, getTwoFactorStatus);
router.put('/2fa/status', isAuthenticated, updateTwoFactorStatus);
router.get('/logout', logout);
router.get('/session', getSession);

module.exports = router;