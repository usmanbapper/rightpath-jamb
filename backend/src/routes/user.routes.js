const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();
const { query } = require('../../config/database');
const bcrypt = require('bcryptjs');
const { authenticate } = require('../middleware/auth.middleware');

function validate(req, res, next) {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: errors.array()[0].msg });
  next();
}

function safeUser(u) {
  const { password_hash, email_verification_token, password_reset_token, ...safe } = u;
  return safe;
}

router.use(authenticate);

// ── GET /api/users/profile ────────────────────────────────────
router.get('/profile', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.*, COUNT(DISTINCT ub.badge_id) AS badge_count
       FROM users u
       LEFT JOIN user_badges ub ON ub.user_id = u.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found.' });
    return res.json({ user: safeUser(result.rows[0]) });
  } catch (err) { next(err); }
});

// ── PATCH /api/users/profile ──────────────────────────────────
router.patch('/profile',
  [
    body('full_name').optional().trim().notEmpty(),
    body('phone').optional().isMobilePhone(),
    body('state').optional().trim(),
    body('school').optional().trim(),
    body('jamb_reg_number').optional().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { full_name, phone, state, school, jamb_reg_number } = req.body;
      const result = await query(
        `UPDATE users SET
           full_name        = COALESCE($1, full_name),
           phone            = COALESCE($2, phone),
           state            = COALESCE($3, state),
           school           = COALESCE($4, school),
           jamb_reg_number  = COALESCE($5, jamb_reg_number),
           updated_at       = NOW()
         WHERE id = $6 RETURNING *`,
        [full_name, phone, state, school, jamb_reg_number, req.user.id]
      );
      return res.json({ message: 'Profile updated.', user: safeUser(result.rows[0]) });
    } catch (err) { next(err); }
  }
);

// ── PATCH /api/users/change-password ─────────────────────────
router.patch('/change-password',
  [
    body('current_password').notEmpty(),
    body('new_password')
      .isLength({ min: 8 }).withMessage('Min 8 characters.')
      .matches(/[A-Z]/).withMessage('Needs an uppercase letter.')
      .matches(/[0-9]/).withMessage('Needs a number.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { current_password, new_password } = req.body;
      const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
      const user   = result.rows[0];

      const match = await bcrypt.compare(current_password, user.password_hash);
      if (!match) return res.status(401).json({ error: 'Current password is incorrect.' });

      const hash = await bcrypt.hash(new_password, 12);
      await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.id]);

      return res.json({ message: 'Password updated successfully.' });
    } catch (err) { next(err); }
  }
);

// ── GET /api/users/badges ─────────────────────────────────────
router.get('/badges', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.*, ub.earned_at, ub.session_id
       FROM user_badges ub
       JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = $1
       ORDER BY ub.earned_at DESC`,
      [req.user.id]
    );
    return res.json({ badges: result.rows });
  } catch (err) { next(err); }
});

// ── GET /api/users/notifications ─────────────────────────────
router.get('/notifications', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );
    return res.json({ notifications: result.rows });
  } catch (err) { next(err); }
});

// ── PATCH /api/users/notifications/read-all ──────────────────
router.patch('/notifications/read-all', async (req, res, next) => {
  try {
    await query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.id]);
    return res.json({ message: 'All notifications marked as read.' });
  } catch (err) { next(err); }
});

module.exports = router;
