const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../../config/database');
const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('../services/email.service');

// ── Token helpers ────────────────────────────────────────────

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
}

function safeUser(user) {
  const { password_hash, email_verification_token, password_reset_token, ...safe } = user;
  return safe;
}

function setCookies(res, accessToken, refreshToken) {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/api/auth/refresh',
  });
}

// ── POST /api/auth/register ──────────────────────────────────

async function register(req, res, next) {
  try {
    const { email, password, full_name, phone, state, school, jamb_reg_number } = req.body;

    // Normalise email
    const normEmail = email.trim().toLowerCase();

    // Check duplicate
    const existing = await query('SELECT id FROM users WHERE email = $1', [normEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h

    const result = await query(
      `INSERT INTO users
         (email, password_hash, full_name, phone, state, school, jamb_reg_number,
          email_verification_token, email_verification_expires)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [normEmail, password_hash, full_name.trim(), phone || null, state || null,
       school || null, jamb_reg_number || null, verificationToken, verificationExpires]
    );

    const user = result.rows[0];

    // Send verification email (non-blocking — don't fail registration if mail fails)
    sendVerificationEmail(user.email, user.full_name, verificationToken).catch((err) => {
      console.error('Verification email failed:', err.message);
    });

    return res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      user: safeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/verify-email ──────────────────────────────

async function verifyEmail(req, res, next) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required.' });
    }

    const result = await query(
      `SELECT * FROM users
       WHERE email_verification_token = $1
         AND email_verification_expires > NOW()
         AND is_email_verified = false`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification token.' });
    }

    const user = result.rows[0];

    await query(
      `UPDATE users
       SET is_email_verified = true,
           email_verification_token = NULL,
           email_verification_expires = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [user.id]
    );

    // Send welcome email
    sendWelcomeEmail(user.email, user.full_name).catch((err) => {
      console.error('Welcome email failed:', err.message);
    });

    return res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/login ─────────────────────────────────────

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const normEmail = email.trim().toLowerCase();

    const result = await query('SELECT * FROM users WHERE email = $1', [normEmail]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact support.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.is_email_verified && process.env.NODE_ENV !== 'production') {
  return res.status(403).json({
    error: 'Please verify your email before logging in.',
    code: 'EMAIL_NOT_VERIFIED',
  });
}

    const tokenPayload = { id: user.id, role: user.role, email: user.email };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken({ id: user.id });

    setCookies(res, accessToken, refreshToken);

    return res.json({
      message: 'Login successful.',
      user: safeUser(user),
      accessToken, // also return in body for clients that prefer header-based auth
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/logout ────────────────────────────────────

async function logout(req, res) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  return res.json({ message: 'Logged out successfully.' });
}

// ── POST /api/auth/refresh ───────────────────────────────────

async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({ error: 'Refresh token missing.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token. Please log in again.' });
    }

    const result = await query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found or deactivated.' });
    }

    const user = result.rows[0];
    const tokenPayload = { id: user.id, role: user.role, email: user.email };
    const newAccessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken({ id: user.id });

    setCookies(res, newAccessToken, newRefreshToken);

    return res.json({
      message: 'Tokens refreshed.',
      accessToken: newAccessToken,
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/forgot-password ───────────────────────────

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const normEmail = email.trim().toLowerCase();

    const result = await query('SELECT * FROM users WHERE email = $1', [normEmail]);

    // Always return 200 to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({ message: 'If that email is registered, a reset link has been sent.' });
    }

    const user = result.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await query(
      `UPDATE users
       SET password_reset_token = $1,
           password_reset_expires = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [resetToken, resetExpires, user.id]
    );

    sendPasswordResetEmail(user.email, user.full_name, resetToken).catch((err) => {
      console.error('Password reset email failed:', err.message);
    });

    return res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/reset-password ────────────────────────────

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;

    const result = await query(
      `SELECT * FROM users
       WHERE password_reset_token = $1
         AND password_reset_expires > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    const user = result.rows[0];
    const password_hash = await bcrypt.hash(password, 12);

    await query(
      `UPDATE users
       SET password_hash = $1,
           password_reset_token = NULL,
           password_reset_expires = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [password_hash, user.id]
    );

    return res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/resend-verification ───────────────────────

async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;
    const normEmail = email.trim().toLowerCase();

    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND is_email_verified = false',
      [normEmail]
    );

    // Prevent enumeration
    if (result.rows.length === 0) {
      return res.json({ message: 'If that email is pending verification, a new link has been sent.' });
    }

    const user = result.rows[0];
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await query(
      `UPDATE users
       SET email_verification_token = $1,
           email_verification_expires = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [verificationToken, verificationExpires, user.id]
    );

    sendVerificationEmail(user.email, user.full_name, verificationToken).catch((err) => {
      console.error('Resend verification email failed:', err.message);
    });

    return res.json({ message: 'If that email is pending verification, a new link has been sent.' });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/auth/me ─────────────────────────────────────────

async function me(req, res, next) {
  try {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ user: safeUser(result.rows[0]) });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  verifyEmail,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  resendVerification,
  me,
};
