const express = require('express');
const router = express.Router();
const authWorker = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');
const paymentController = require('../controllers/paymentController');

// ============================================================================
// WORKER / ARCHITECT / INTERIOR PROJECT PAYMENT & ESCROW ROUTES
// ============================================================================

router.post('/initialize-escrow', authWorker, requireRole('customer'), paymentController.initializeEscrow);
router.post('/worker/create-order', authWorker, requireRole('customer'), paymentController.createWorkerPaymentOrder);
router.post('/worker/verify-payment', authWorker, requireRole('customer'), paymentController.verifyWorkerPayment);
router.post('/collect-milestone', authWorker, requireRole('customer'), paymentController.collectMilestonePayment);
router.post('/release-milestone', authWorker, requireRole('customer'), paymentController.releaseMilestonePayment);

// ============================================================================
// WORKER EARNINGS & REVENUE ROUTES
// ============================================================================

router.get('/worker/earnings', authWorker, requireRole('worker'), paymentController.getWorkerEarnings);
router.post('/worker/withdraw', authWorker, requireRole('worker'), paymentController.requestWithdrawal);
router.get('/worker/transactions', authWorker, requireRole('worker'), paymentController.getTransactionHistory);

// ============================================================================
// COMPANY / CONSTRUCTION PROJECT PAYMENTS (Razorpay — 5% platform fee)
// ============================================================================

/**
 * @route   POST /api/payment/company/create-order
 * @desc    Create a Razorpay order for a construction project milestone payment
 * @access  Private (Customer)
 * @body    { projectId, milestonePercentage }
 *          milestonePercentage: 25 | 50 | 75 | 100
 */
router.post('/company/create-order', authWorker, requireRole('customer'), paymentController.createCompanyPaymentOrder);

/**
 * @route   POST /api/payment/company/verify-payment
 * @desc    Verify Razorpay signature and hold funds in escrow
 * @access  Private (Customer)
 * @body    { projectId, milestonePercentage, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
router.post('/company/verify-payment', authWorker, requireRole('customer'), paymentController.verifyCompanyPayment);

/**
 * @route   POST /api/payment/company/test-mark-paid
 * @desc    Test-mode shortcut to mark installment as paid without Razorpay checkout details
 * @access  Private (Customer, non-production only)
 * @body    { projectId, milestonePercentage, testAmount? }
 */
router.post(
	'/company/test-mark-paid',
	authWorker,
	requireRole('customer'),
	(req, _res, next) => {
		req.body.testBypass = true;
		next();
	},
	paymentController.verifyCompanyPayment
);

/**
 * @route   POST /api/payment/company/release-milestone
 * @desc    Release held escrow funds to company (minus 5% platform fee)
 * @access  Private (Customer or Admin)
 * @body    { projectId, milestonePercentage }
 */
router.post('/company/release-milestone', authWorker, requireRole('customer'), paymentController.releaseCompanyMilestonePayment);
router.post('/company/platform-fee/create-order', authWorker, requireRole('company'), paymentController.createCompanyPlatformFeeOrder);
router.post('/company/platform-fee/verify-payment', authWorker, requireRole('company'), paymentController.verifyCompanyPlatformFeePayment);
router.post(
	'/company/platform-fee/test-mark-paid',
	authWorker,
	requireRole('company'),
	(req, _res, next) => {
		req.body.testBypass = true;
		next();
	},
	paymentController.verifyCompanyPlatformFeePayment
);

/**
 * @route   GET /api/payment/company/summary/:projectId
 * @desc    Get full payment summary for a construction project
 * @access  Private (Customer, Company, or Admin)
 */
router.get('/company/summary/:projectId', authWorker, requireRole('customer', 'company'), paymentController.getCompanyProjectPaymentSummary);

module.exports = router;

