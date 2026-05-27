const { query } = require('../../config/database');

/**
 * Evaluate and award any badges the user has just earned.
 * Called after every exam submission.
 * Returns array of newly-earned badge objects (may be empty).
 *
 * @param {string} userId
 * @param {object} session  - the submitted exam_sessions row
 * @param {object} subjectScores - { subjectCode: { score, total } }
 */
async function awardBadges(userId, session, subjectScores = {}) {
  const newBadges = [];

  try {
    // Fetch user's current stats + already-owned badge IDs
    const [userRes, ownedRes, allBadgesRes] = await Promise.all([
      query('SELECT total_exams_taken, average_score FROM users WHERE id = $1', [userId]),
      query('SELECT badge_id FROM user_badges WHERE user_id = $1', [userId]),
      query('SELECT * FROM badges WHERE is_active = true'),
    ]);

    const user        = userRes.rows[0];
    const ownedIds    = new Set(ownedRes.rows.map(r => r.badge_id));
    const allBadges   = allBadgesRes.rows;

    const totalExams  = user.total_exams_taken;
    const avgScore    = parseFloat(user.average_score);
    const pct         = parseFloat(session.percentage_score);
    const hour        = new Date(session.submitted_at).getHours();

    // Subject helpers
    const engPct  = subjectScores['ENG']?.pct ?? 0;
    const mthPct  = subjectScores['MTH']?.pct ?? 0;
    const sciPct  = Math.max(
      subjectScores['PHY']?.pct ?? 0,
      subjectScores['CHE']?.pct ?? 0,
      subjectScores['BIO']?.pct ?? 0,
    );

    // Previous best score (for Rising Star)
    const prevBestRes = await query(
      `SELECT MAX(percentage_score) AS best
       FROM exam_sessions
       WHERE user_id = $1 AND status = 'submitted' AND id != $2`,
      [userId, session.id]
    );
    const prevBest = parseFloat(prevBestRes.rows[0]?.best ?? 0);

    for (const badge of allBadges) {
      if (ownedIds.has(badge.id)) continue; // already earned

      let earned = false;

      switch (badge.criteria_type) {
        case 'exams_completed':   earned = totalExams >= badge.criteria_value;           break;
        case 'single_score':      earned = pct >= badge.criteria_value;                  break;
        case 'average_score':     earned = totalExams >= 5 && avgScore >= badge.criteria_value; break;
        case 'subject_score_eng': earned = engPct >= badge.criteria_value;               break;
        case 'subject_score_mth': earned = mthPct >= badge.criteria_value;               break;
        case 'subject_score_sci': earned = sciPct >= badge.criteria_value;               break;
        case 'improvement':       earned = prevBest > 0 && (pct - prevBest) >= badge.criteria_value; break;
        case 'time_of_day':
          if (badge.name === 'Night Owl') earned = hour >= badge.criteria_value;
          if (badge.name === 'Early Bird') earned = hour < badge.criteria_value;
          break;
      }

      if (earned) {
        await query(
          `INSERT INTO user_badges (user_id, badge_id, session_id)
           VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [userId, badge.id, session.id]
        );

        // Create in-app notification
        await query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES ($1, $2, $3, 'badge')`,
          [userId, `🏅 Badge Earned: ${badge.name}`, badge.description]
        );

        newBadges.push(badge);
      }
    }
  } catch (err) {
    // Non-fatal — log but don't crash the submission
    console.error('Badge award error:', err.message);
  }

  return newBadges;
}

module.exports = { awardBadges };
