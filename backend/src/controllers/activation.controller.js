const { query, getClient } = require('../../config/database');

// ── POST /api/activation/redeem ──────────────────────────────
// Student redeems an activation code to unlock exam access.

async function redeemCode(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { code } = req.body;
    const userId   = req.user.id;

    // Check user isn't already active
    const userRes = await client.query(
      'SELECT activation_status, activation_expires_at FROM users WHERE id = $1',
      [userId]
    );
    const user = userRes.rows[0];

    if (user.activation_status === 'active' && new Date(user.activation_expires_at) > new Date()) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'You already have an active subscription.' });
    }

    // Find and lock the code row
    const codeRes = await client.query(
      `SELECT * FROM activation_codes
       WHERE code = $1 AND is_used = false AND is_active = true
       FOR UPDATE`,
      [code.trim().toUpperCase()]
    );

    if (codeRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid or already used activation code.' });
    }

    const activationCode = codeRes.rows[0];

    // Check code-level expiry (some codes have a hard expires_at)
    if (activationCode.expires_at && new Date(activationCode.expires_at) < new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This activation code has expired.' });
    }

    const activatedAt  = new Date();
    const expiresAt    = new Date(activatedAt.getTime() + activationCode.valid_days * 24 * 60 * 60 * 1000);

    // Mark code as used
    await client.query(
      `UPDATE activation_codes
       SET is_used = true, used_by = $1, used_at = NOW()
       WHERE id = $2`,
      [userId, activationCode.id]
    );

    // Activate user
    await client.query(
      `UPDATE users
       SET activation_status = 'active',
           activated_at       = $1,
           activation_expires_at = $2,
           updated_at         = NOW()
       WHERE id = $3`,
      [activatedAt, expiresAt, userId]
    );

    await client.query('COMMIT');

    return res.json({
      message: `Activation successful! Your subscription is valid for ${activationCode.valid_days} days.`,
      activation: {
        activated_at:  activatedAt,
        expires_at:    expiresAt,
        valid_days:    activationCode.valid_days,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// ── GET /api/activation/status ───────────────────────────────

async function getStatus(req, res, next) {
  try {
    const result = await query(
      `SELECT activation_status, activated_at, activation_expires_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    const user = result.rows[0];
    const now  = new Date();
    const expiresAt = user.activation_expires_at ? new Date(user.activation_expires_at) : null;

    const daysRemaining = expiresAt
      ? Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)))
      : 0;

    return res.json({
      status:         user.activation_status,
      activated_at:   user.activated_at,
      expires_at:     expiresAt,
      days_remaining: daysRemaining,
      is_active:      user.activation_status === 'active' && expiresAt > now,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { redeemCode, getStatus };
