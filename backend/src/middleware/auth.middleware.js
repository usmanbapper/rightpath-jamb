const jwt = require('jsonwebtoken');
const { query } = require('../../config/database');

// ── Extract token from request ───────────────────────────────
// Supports: Authorization header (Bearer) OR httpOnly cookie

function extractToken(req) {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.slice(7);
  }
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  return null;
}

// ── authenticate ─────────────────────────────────────────────
// Verifies the JWT and attaches req.user.
// Rejects with 401 if missing or invalid.

async function authenticate(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token. Please log in again.' });
  }

  // Attach lightweight user object (avoids a DB hit on every request)
  req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
  next();
}

// ── optionalAuth ─────────────────────────────────────────────
// Like authenticate but doesn't reject — attaches req.user if
// a valid token is present, otherwise leaves req.user undefined.

async function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
  } catch {
    // silently ignore bad tokens in optional mode
  }
  next();
}

// ── requireRole ──────────────────────────────────────────────
// Factory that returns middleware restricting access to specific roles.
// Usage: requireRole('admin'), requireRole('admin', 'superadmin')

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to access this resource.' });
    }
    next();
  };
}

// ── requireActivation ────────────────────────────────────────
// Ensures the student has an active subscription (activation code redeemed).
// Must be used AFTER authenticate.
// Admins and superadmins bypass this check.

async function requireActivation(req, res, next) {
  try {
    if (['admin', 'superadmin'].includes(req.user.role)) {
      return next();
    }

    const result = await query(
      `SELECT activation_status, activation_expires_at FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { activation_status, activation_expires_at } = result.rows[0];

    if (activation_status !== 'active') {
      return res.status(403).json({
        error: 'You need an active subscription to access this feature. Please redeem an activation code.',
        code: 'ACTIVATION_REQUIRED',
      });
    }

    // Check expiry
    if (activation_expires_at && new Date(activation_expires_at) < new Date()) {
      // Mark as expired
      await query(
        `UPDATE users SET activation_status = 'expired', updated_at = NOW() WHERE id = $1`,
        [req.user.id]
      );
      return res.status(403).json({
        error: 'Your subscription has expired. Please renew your activation code.',
        code: 'ACTIVATION_EXPIRED',
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}

// ── requireEmailVerified ──────────────────────────────────────
// Checks the DB to confirm the user's email is verified.
// Most routes rely on the JWT claim; use this for sensitive operations.

async function requireEmailVerified(req, res, next) {
  try {
    const result = await query(
      'SELECT is_email_verified FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!result.rows[0]?.is_email_verified) {
      return res.status(403).json({
        error: 'Please verify your email to access this feature.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  authenticate,
  optionalAuth,
  requireRole,
  requireActivation,
  requireEmailVerified,
};
