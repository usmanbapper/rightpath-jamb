const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const {
  register,
  verifyEmail,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  resendVerification,
  me,
} = require('../controllers/auth.controller');

const { authenticate } = require('../middleware/auth.middleware');

// ── Validation middleware ────────────────────────────────────

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: errors.array()[0].msg, errors: errors.array() });
  }
  next();
}

const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required.'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
  body('full_name').trim().notEmpty().withMessage('Full name is required.').isLength({ max: 255 }),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number.'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

const forgotPasswordRules = [
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required.'),
];

const resetPasswordRules = [
  body('token').notEmpty().withMessage('Reset token is required.'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
];

// ── Routes ───────────────────────────────────────────────────

// Public routes
router.post('/register',              registerRules,      validate, register);
router.post('/verify-email',                                        verifyEmail);
router.post('/resend-verification',   forgotPasswordRules, validate, resendVerification);
router.post('/login',                 loginRules,         validate, login);
router.post('/logout',                                              logout);
router.post('/refresh',                                             refresh);
router.post('/forgot-password',       forgotPasswordRules, validate, forgotPassword);
router.post('/reset-password',        resetPasswordRules, validate, resetPassword);

// Protected routes
router.get('/me', authenticate, me);

module.exports = router;
