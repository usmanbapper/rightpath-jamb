const { query, getClient } = require('../../config/database');
const { awardBadges } = require('../utils/badge.util');

// ── Helpers ──────────────────────────────────────────────────

/** Fisher-Yates shuffle */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildShuffledOptions(question) {
  const originals = ['A', 'B', 'C', 'D'];
  const shuffled  = shuffle(originals);
  const mapping   = {};
  const options   = {};

  shuffled.forEach((origLetter, idx) => {
    const displayLetter = originals[idx];
    mapping[displayLetter] = origLetter;
    options[displayLetter] = question[`option_${origLetter.toLowerCase()}`];
  });

  return { mapping, options };
}

function getDisplayedCorrectAnswer(correctOrig, mapping) {
  return Object.keys(mapping).find(d => mapping[d] === correctOrig) ?? correctOrig;
}

// ── GET /api/exams/subjects ───────────────────────────────────

async function getSubjects(req, res, next) {
  try {
    const result = await query(
      'SELECT id, name, code, description, is_compulsory, icon, color FROM subjects WHERE is_active = true ORDER BY name'
    );
    return res.json({ subjects: result.rows });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/exams/configs ────────────────────────────────────

async function getExamConfigs(req, res, next) {
  try {
    const result = await query(
      'SELECT * FROM exam_configs WHERE is_active = true ORDER BY created_at DESC'
    );
    return res.json({ configs: result.rows });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/exams/start ─────────────────────────────────────

async function startExam(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const userId = req.user.id;
    let { subject_ids, exam_config_id } = req.body;

    if (!Array.isArray(subject_ids) || subject_ids.length !== 4) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You must select exactly 4 subjects.' });
    }

    const engRes = await client.query(
      "SELECT id FROM subjects WHERE code = 'ENG' AND is_active = true"
    );
    const engId = engRes.rows[0]?.id;
    if (engId && !subject_ids.includes(engId)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Use of English is compulsory and must be included.' });
    }

    let config;
    if (exam_config_id) {
      const cfgRes = await client.query(
        'SELECT * FROM exam_configs WHERE id = $1 AND is_active = true',
        [exam_config_id]
      );
      config = cfgRes.rows[0];
    } else {
      const cfgRes = await client.query(
        'SELECT * FROM exam_configs WHERE is_active = true ORDER BY created_at DESC LIMIT 1'
      );
      config = cfgRes.rows[0];
    }

    if (!config) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'No exam configuration found.' });
    }

    const questionsPerSubject = Math.floor(config.total_questions / 4);
    const durationSeconds     = config.duration_minutes * 60;

    // ── Sample questions per subject ───────────────────────
    const allExamQuestions = [];
    let questionOrder = 1;

    for (const subjectId of subject_ids) {
      const qRes = await client.query(
        `SELECT * FROM questions
         WHERE subject_id = $1 AND is_active = true
         ORDER BY RANDOM()
         LIMIT $2`,
        [subjectId, questionsPerSubject]
      );

      // FIX #3: Tell the caller exactly which subject is missing questions
      if (qRes.rows.length === 0) {
        const subjectRes = await client.query(
          'SELECT name FROM subjects WHERE id = $1',
          [subjectId]
        );
        const subjectName = subjectRes.rows[0]?.name || `ID ${subjectId}`;
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Not enough questions available for subject: "${subjectName}". Please contact support.`,
        });
      }

      for (const q of qRes.rows) {
        const { mapping, options } = buildShuffledOptions(q);
        allExamQuestions.push({
          question_id:      q.id,
          subject_id:       subjectId,
          question_order:   questionOrder++,
          shuffled_options: { mapping, options },
          original:         q,
        });
      }
    }

    // ── Create exam session ────────────────────────────────
    const sessionRes = await client.query(
      `INSERT INTO exam_sessions
         (user_id, exam_config_id, selected_subjects, total_questions,
          time_remaining_seconds, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        config.id,
        subject_ids,
        allExamQuestions.length,
        durationSeconds,
        req.ip,
        req.headers['user-agent'] || null,
      ]
    );

    const session = sessionRes.rows[0];

    // ── Bulk-insert exam_questions (single query) ──────────
    const valuePlaceholders = [];
    const valueParams       = [];
    let   paramIdx          = 1;

    for (const eq of allExamQuestions) {
      valuePlaceholders.push(
        `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`
      );
      valueParams.push(
        session.id,
        eq.question_id,
        eq.subject_id,
        eq.question_order,
        JSON.stringify(eq.shuffled_options)
      );
    }

    const insertedRes = await client.query(
      `INSERT INTO exam_questions
         (session_id, question_id, subject_id, question_order, shuffled_options)
       VALUES ${valuePlaceholders.join(', ')}
       RETURNING id, question_id, question_order`,
      valueParams
    );

    await client.query('COMMIT');

    // ── Build response ─────────────────────────────────────
    const idMap = {};
    insertedRes.rows.forEach(r => { idMap[r.question_id] = r.id; });

    const questionsForClient = allExamQuestions.map(eq => ({
      exam_question_id: idMap[eq.question_id],
      question_id:      eq.question_id,
      subject_id:       eq.subject_id,
      question_order:   eq.question_order,
      question_text:    eq.original.question_text,
      options:          eq.shuffled_options.options,
      is_flagged:       false,
      selected_answer:  null,
    }));

    return res.status(201).json({
      message: 'Exam started. Good luck!',
      session: {
        id:               session.id,
        duration_seconds: durationSeconds,
        total_questions:  allExamQuestions.length,
        started_at:       session.started_at,
      },
      questions: questionsForClient,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// ── PATCH /api/exams/:sessionId/answer ───────────────────────

async function saveAnswer(req, res, next) {
  try {
    const { sessionId }                                              = req.params;
    const { exam_question_id, selected_answer, time_spent_seconds } = req.body;

    const sessionRes = await query(
      'SELECT id, status FROM exam_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, req.user.id]
    );

    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ error: 'Exam session not found.' });
    }
    if (sessionRes.rows[0].status !== 'in_progress') {
      return res.status(400).json({ error: 'This exam has already been submitted.' });
    }

    const updateRes = await query(
      `UPDATE exam_questions
       SET selected_answer    = $1,
           time_spent_seconds = $2,
           answered_at        = NOW()
       WHERE id = $3 AND session_id = $4
       RETURNING id`,
      [selected_answer || null, time_spent_seconds || 0, exam_question_id, sessionId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found in this session.' });
    }

    await query(
      `UPDATE exam_sessions
       SET answered_questions = (
         SELECT COUNT(*) FROM exam_questions
         WHERE session_id = $1 AND selected_answer IS NOT NULL
       )
       WHERE id = $1`,
      [sessionId]
    );

    return res.json({ message: 'Answer saved.' });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/exams/:sessionId/flag ─────────────────────────

async function flagQuestion(req, res, next) {
  try {
    const { sessionId }        = req.params;
    const { exam_question_id } = req.body;

    const sessionRes = await query(
      'SELECT status FROM exam_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, req.user.id]
    );
    if (!sessionRes.rows[0] || sessionRes.rows[0].status !== 'in_progress') {
      return res.status(400).json({ error: 'Session not found or already submitted.' });
    }

    const result = await query(
      `UPDATE exam_questions
       SET is_flagged = NOT is_flagged
       WHERE id = $1 AND session_id = $2
       RETURNING is_flagged`,
      [exam_question_id, sessionId]
    );

    return res.json({ is_flagged: result.rows[0]?.is_flagged });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/exams/:sessionId/sync-time ────────────────────

async function syncTime(req, res, next) {
  try {
    const { sessionId }              = req.params;
    const { time_remaining_seconds } = req.body;

    await query(
      `UPDATE exam_sessions SET time_remaining_seconds = $1
       WHERE id = $2 AND user_id = $3 AND status = 'in_progress'`,
      [time_remaining_seconds, sessionId, req.user.id]
    );

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/exams/:sessionId/submit ────────────────────────

async function submitExam(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { sessionId }         = req.params;
    const { timed_out = false } = req.body;
    const userId                = req.user.id;

    const sessionRes = await client.query(
      'SELECT * FROM exam_sessions WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [sessionId, userId]
    );

    if (sessionRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Exam session not found.' });
    }

    const session = sessionRes.rows[0];
    if (session.status !== 'in_progress') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This exam has already been submitted.' });
    }

    const questionsRes = await client.query(
      `SELECT eq.id, eq.question_id, eq.subject_id, eq.selected_answer,
              eq.shuffled_options, q.correct_answer, q.explanation,
              q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
              s.code AS subject_code, s.name AS subject_name
       FROM exam_questions eq
       JOIN questions q ON q.id  = eq.question_id
       JOIN subjects  s ON s.id  = eq.subject_id
       WHERE eq.session_id = $1`,
      [sessionId]
    );

    const questions = questionsRes.rows;

    // ── Grade ──────────────────────────────────────────────
    let totalScore = 0;
    const subjectBuckets = {};
    const gradedUpdates  = [];

    for (const q of questions) {
      if (!subjectBuckets[q.subject_id]) {
        subjectBuckets[q.subject_id] = {
          code: q.subject_code, name: q.subject_name, correct: 0, total: 0,
        };
      }
      const bucket = subjectBuckets[q.subject_id];
      bucket.total++;

      let is_correct = false;
      if (q.selected_answer) {
        const mapping     = q.shuffled_options?.mapping ?? {};
        const originalSel = mapping[q.selected_answer] ?? q.selected_answer;
        is_correct        = originalSel === q.correct_answer;
      }

      if (is_correct) { totalScore++; bucket.correct++; }
      gradedUpdates.push({ id: q.id, is_correct });
    }

    // FIX #6: Simplified bulk is_correct update — 2 queries instead of
    // one giant CASE statement with up to 360 params for 180 questions.
    const correctIds = gradedUpdates.filter(u =>  u.is_correct).map(u => u.id);
    const wrongIds   = gradedUpdates.filter(u => !u.is_correct).map(u => u.id);

    if (correctIds.length > 0) {
      await client.query(
        'UPDATE exam_questions SET is_correct = true  WHERE id = ANY($1)',
        [correctIds]
      );
    }
    if (wrongIds.length > 0) {
      await client.query(
        'UPDATE exam_questions SET is_correct = false WHERE id = ANY($1)',
        [wrongIds]
      );
    }

    // ── Build subject_scores ───────────────────────────────
    const subjectScores = {};
    for (const [subId, b] of Object.entries(subjectBuckets)) {
      subjectScores[subId] = {
        code:  b.code,
        name:  b.name,
        score: b.correct,
        total: b.total,
        pct:   b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0,
      };
    }

    const totalQ       = questions.length;
    const percentScore = totalQ > 0 ? Math.round((totalScore / totalQ) * 100 * 100) / 100 : 0;
    const submittedAt  = new Date();
    const finalStatus  = timed_out ? 'timed_out' : 'submitted';

    await client.query(
      `UPDATE exam_sessions
       SET status                 = $1,
           submitted_at           = $2,
           total_score            = $3,
           percentage_score       = $4,
           subject_scores         = $5,
           answered_questions     = $6,
           time_remaining_seconds = 0
       WHERE id = $7`,
      [
        finalStatus, submittedAt, totalScore, percentScore,
        JSON.stringify(subjectScores),
        questions.filter(q => q.selected_answer).length,
        sessionId,
      ]
    );

    await client.query(
      `UPDATE users
       SET total_exams_taken = total_exams_taken + 1,
           average_score = (
             SELECT ROUND(AVG(percentage_score)::NUMERIC, 2)
             FROM exam_sessions
             WHERE user_id = $1 AND status IN ('submitted', 'timed_out')
           ),
           updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    // ── Bulk update question stats ─────────────────────────
    const answeredQs = questions.filter(q => q.selected_answer);
    if (answeredQs.length > 0) {
      const answeredIds = answeredQs.map(q => q.question_id);
      const correctQIds = answeredQs
        .filter(q => gradedUpdates.find(u => u.id === q.id)?.is_correct)
        .map(q => q.question_id);

      await client.query(
        'UPDATE questions SET times_answered = times_answered + 1 WHERE id = ANY($1)',
        [answeredIds]
      );
      if (correctQIds.length > 0) {
        await client.query(
          'UPDATE questions SET times_correct = times_correct + 1 WHERE id = ANY($1)',
          [correctQIds]
        );
      }
    }

    await client.query('COMMIT');

    const updatedSession      = { ...session, percentage_score: percentScore, submitted_at: submittedAt };
    const subjectScoresByCode = {};
    for (const b of Object.values(subjectScores)) subjectScoresByCode[b.code] = b;
    const newBadges = await awardBadges(userId, updatedSession, subjectScoresByCode);

    const result = questions.map(q => {
      const mapping          = q.shuffled_options?.mapping ?? {};
      const displayedCorrect = getDisplayedCorrectAnswer(q.correct_answer, mapping);
      return {
        exam_question_id: q.id,
        question_text:    q.question_text,
        subject_name:     q.subject_name,
        options:          q.shuffled_options?.options ?? {},
        selected_answer:  q.selected_answer,
        correct_answer:   displayedCorrect,
        original_correct: q.correct_answer,
        is_correct:       gradedUpdates.find(u => u.id === q.id)?.is_correct ?? false,
        explanation:      q.explanation,
      };
    });

    return res.json({
      message:          timed_out ? 'Time up! Exam auto-submitted.' : 'Exam submitted successfully!',
      session_id:       sessionId,
      status:           finalStatus,
      total_score:      totalScore,
      total_questions:  totalQ,
      percentage_score: percentScore,
      subject_scores:   subjectScores,
      new_badges:       newBadges,
      results:          result,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// ── GET /api/exams/history ────────────────────────────────────

async function getHistory(req, res, next) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT id, status, started_at, submitted_at, total_questions,
              total_score, percentage_score, subject_scores, selected_subjects
       FROM exam_sessions
       WHERE user_id = $1 AND status != 'abandoned'
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    const total = await query(
      "SELECT COUNT(*) FROM exam_sessions WHERE user_id = $1 AND status != 'abandoned'",
      [req.user.id]
    );

    return res.json({
      sessions:   result.rows,
      pagination: { page: +page, limit: +limit, total: +total.rows[0].count },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/exams/:sessionId/review ─────────────────────────

async function getReview(req, res, next) {
  try {
    const { sessionId } = req.params;

    const sessionRes = await query(
      'SELECT * FROM exam_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, req.user.id]
    );

    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const session = sessionRes.rows[0];
    if (session.status === 'in_progress') {
      return res.status(400).json({ error: 'Cannot review an exam that is still in progress.' });
    }

    const questionsRes = await query(
      `SELECT eq.id, eq.question_order, eq.selected_answer, eq.is_correct,
              eq.is_flagged, eq.time_spent_seconds, eq.shuffled_options,
              q.question_text, q.correct_answer, q.explanation,
              q.option_a, q.option_b, q.option_c, q.option_d,
              s.name AS subject_name, s.code AS subject_code
       FROM exam_questions eq
       JOIN questions q ON q.id = eq.question_id
       JOIN subjects  s ON s.id = eq.subject_id
       WHERE eq.session_id = $1
       ORDER BY eq.question_order`,
      [sessionId]
    );

    const questions = questionsRes.rows.map(q => {
      const mapping          = q.shuffled_options?.mapping ?? {};
      const displayedCorrect = getDisplayedCorrectAnswer(q.correct_answer, mapping);
      return {
        id:                 q.id,
        question_order:     q.question_order,
        subject_name:       q.subject_name,
        subject_code:       q.subject_code,
        question_text:      q.question_text,
        options:            q.shuffled_options?.options ?? {},
        selected_answer:    q.selected_answer,
        correct_answer:     displayedCorrect,
        is_correct:         q.is_correct,
        is_flagged:         q.is_flagged,
        time_spent_seconds: q.time_spent_seconds,
        explanation:        q.explanation,
      };
    });

    await query('UPDATE exam_sessions SET is_reviewed = true WHERE id = $1', [sessionId]);

    return res.json({ session, questions });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSubjects,
  getExamConfigs,
  startExam,
  saveAnswer,
  flagQuestion,
  syncTime,
  submitExam,
  getHistory,
  getReview,
};