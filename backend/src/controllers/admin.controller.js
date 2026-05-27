const { query, getClient } = require('../../config/database');
const crypto  = require('crypto');
const pdfParse = require('pdf-parse');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

// ── Multer config (memory storage for PDF/JSON) ──────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.json'];
    const ext     = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('Only PDF and JSON files are accepted.'));
  },
});

// ── Code generator ───────────────────────────────────────────

function generateCode(length = 16) {
  // Format: XXXX-XXXX-XXXX-XXXX  (alphanumeric, uppercase, no ambiguous chars)
  const chars  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const raw    = Array.from({ length }, () => chars[crypto.randomInt(chars.length)]).join('');
  return `${raw.slice(0,4)}-${raw.slice(4,8)}-${raw.slice(8,12)}-${raw.slice(12,16)}`;
}

// ── POST /api/admin/activation-codes/generate ─────────────────
// Body: { count, valid_days, batch_name?, notes?, expires_at? }

async function generateActivationCodes(req, res, next) {
  try {
    const {
      count      = 1,
      valid_days = 30,
      batch_name = null,
      notes      = null,
      expires_at = null,
    } = req.body;

    if (count < 1 || count > 500) {
      return res.status(400).json({ error: 'Count must be between 1 and 500.' });
    }

    const codes = [];
    const generated = [];

    // Generate unique codes (retry on collision)
    while (codes.length < count) {
      const code = generateCode();
      const exists = await query(
        'SELECT id FROM activation_codes WHERE code = $1', [code]
      );
      if (exists.rows.length === 0) codes.push(code);
    }

    for (const code of codes) {
      const res2 = await query(
        `INSERT INTO activation_codes
           (code, generated_by, valid_days, batch_name, notes, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [code, req.user.id, valid_days, batch_name, notes, expires_at || null]
      );
      generated.push(res2.rows[0]);
    }

    return res.status(201).json({
      message:    `${count} activation code(s) generated successfully.`,
      batch_name,
      valid_days,
      codes:      generated,
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/activation-codes ──────────────────────────

async function listActivationCodes(req, res, next) {
  try {
    const { page = 1, limit = 50, batch_name, is_used } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params    = [];

    if (batch_name) {
      params.push(batch_name);
      whereClause += ` AND batch_name = $${params.length}`;
    }
    if (is_used !== undefined) {
      params.push(is_used === 'true');
      whereClause += ` AND is_used = $${params.length}`;
    }

    params.push(limit, offset);
    const result = await query(
      `SELECT ac.*, u.full_name AS used_by_name, u.email AS used_by_email
       FROM activation_codes ac
       LEFT JOIN users u ON u.id = ac.used_by
       ${whereClause}
       ORDER BY ac.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const totalRes = await query(
      `SELECT COUNT(*) FROM activation_codes ${whereClause}`,
      params.slice(0, -2)
    );

    return res.json({
      codes:      result.rows,
      pagination: { page: +page, limit: +limit, total: +totalRes.rows[0].count },
    });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/admin/activation-codes/:id ────────────────────

async function deactivateCode(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE activation_codes SET is_active = false WHERE id = $1 AND is_used = false RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Code not found or already used.' });
    }

    return res.json({ message: 'Activation code deactivated.' });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/students ───────────────────────────────────

async function listStudents(req, res, next) {
  try {
    const { page = 1, limit = 20, search, activation_status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE role = 'student'";
    const params    = [];

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (full_name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }
    if (activation_status) {
      params.push(activation_status);
      whereClause += ` AND activation_status = $${params.length}`;
    }

    params.push(limit, offset);
    const result = await query(
      `SELECT id, full_name, email, phone, state, school,
              activation_status, activated_at, activation_expires_at,
              total_exams_taken, average_score, is_email_verified,
              is_active, created_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const totalRes = await query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      params.slice(0, -2)
    );

    return res.json({
      students:   result.rows,
      pagination: { page: +page, limit: +limit, total: +totalRes.rows[0].count },
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/admin/students/:id/toggle ─────────────────────

async function toggleStudentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE users SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1 AND role = 'student'
       RETURNING id, is_active, full_name`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    const u = result.rows[0];
    return res.json({
      message: `${u.full_name} has been ${u.is_active ? 'activated' : 'deactivated'}.`,
      student: u,
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/admin/questions/manual ─────────────────────────
// Body: { subject_id, question_text, option_a..d, correct_answer, explanation?, year?, difficulty?, topic? }

async function addQuestionManual(req, res, next) {
  try {
    const {
      subject_id, question_text,
      option_a, option_b, option_c, option_d,
      correct_answer, explanation, year, difficulty, topic,
    } = req.body;

    const result = await query(
      `INSERT INTO questions
         (subject_id, question_text, option_a, option_b, option_c, option_d,
          correct_answer, explanation, year, difficulty, topic, uploaded_by, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'manual')
       RETURNING *`,
      [
        subject_id, question_text,
        option_a, option_b, option_c, option_d,
        correct_answer.toUpperCase(), explanation || null,
        year || null, difficulty || 'medium', topic || null, req.user.id,
      ]
    );

    return res.status(201).json({ message: 'Question added.', question: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/admin/questions/upload ─────────────────────────
// Accepts JSON file with array of question objects.
// PDF upload: extracts text then returns it for manual review (no auto-parse).

async function uploadQuestions(req, res, next) {
  try {
    const file       = req.file;
    const { subject_id } = req.body;

    if (!file)       return res.status(400).json({ error: 'No file uploaded.' });
    if (!subject_id) return res.status(400).json({ error: 'subject_id is required.' });

    const ext = path.extname(file.originalname).toLowerCase();

    // ── PDF upload ─────────────────────────────────────────
    if (ext === '.pdf') {
      const batchRes = await query(
        `INSERT INTO upload_batches (uploaded_by, subject_id, filename, upload_type, status)
         VALUES ($1,$2,$3,'pdf','completed') RETURNING id`,
        [req.user.id, subject_id, file.originalname]
      );

      let extractedText = '';
      try {
        const parsed = await pdfParse(file.buffer);
        extractedText = parsed.text;
      } catch (e) {
        await query(
          "UPDATE upload_batches SET status = 'failed', error_message = $1 WHERE id = $2",
          [e.message, batchRes.rows[0].id]
        );
        return res.status(422).json({ error: 'Could not extract text from PDF.', detail: e.message });
      }

      return res.json({
        message:        'PDF text extracted. Please review and upload questions as JSON.',
        batch_id:       batchRes.rows[0].id,
        extracted_text: extractedText.slice(0, 50000), // cap to 50k chars
      });
    }

    // ── JSON upload ────────────────────────────────────────
    if (ext === '.json') {
      let questions;
      try {
        questions = JSON.parse(file.buffer.toString('utf8'));
      } catch {
        return res.status(400).json({ error: 'Invalid JSON file.' });
      }

      if (!Array.isArray(questions)) {
        return res.status(400).json({ error: 'JSON must be an array of question objects.' });
      }

      const required = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer'];

      const batchRes = await query(
        `INSERT INTO upload_batches (uploaded_by, subject_id, filename, upload_type, status)
         VALUES ($1,$2,$3,'json','processing') RETURNING id`,
        [req.user.id, subject_id, file.originalname]
      );
      const batchId = batchRes.rows[0].id;

      let inserted  = 0;
      const errors  = [];

      const client = await getClient();
      try {
        await client.query('BEGIN');

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];

          // Validate required fields
          const missing = required.filter(f => !q[f]);
          if (missing.length > 0) {
            errors.push({ index: i, error: `Missing: ${missing.join(', ')}` });
            continue;
          }

          const answer = String(q.correct_answer).toUpperCase();
          if (!['A', 'B', 'C', 'D'].includes(answer)) {
            errors.push({ index: i, error: 'correct_answer must be A, B, C, or D.' });
            continue;
          }

          await client.query(
            `INSERT INTO questions
               (subject_id, question_text, option_a, option_b, option_c, option_d,
                correct_answer, explanation, year, difficulty, topic, uploaded_by, source)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'json_upload')
             ON CONFLICT DO NOTHING`,
            [
              subject_id,
              q.question_text,
              q.option_a, q.option_b, q.option_c, q.option_d,
              answer,
              q.explanation    || null,
              q.year           || null,
              q.difficulty     || 'medium',
              q.topic          || null,
              req.user.id,
            ]
          );
          inserted++;
        }

        await client.query(
          `UPDATE upload_batches
           SET status = 'completed', questions_count = $1 WHERE id = $2`,
          [inserted, batchId]
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        await query(
          "UPDATE upload_batches SET status = 'failed', error_message = $1 WHERE id = $2",
          [err.message, batchId]
        );
        throw err;
      } finally {
        client.release();
      }

      return res.status(201).json({
        message:        `Uploaded ${inserted} question(s) successfully.`,
        batch_id:       batchId,
        inserted,
        skipped:        questions.length - inserted - errors.length,
        errors,
      });
    }

    return res.status(400).json({ error: 'Unsupported file type.' });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/questions ──────────────────────────────────

async function listQuestions(req, res, next) {
  try {
    const { page = 1, limit = 20, subject_id, year, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE q.is_active = true';
    const params    = [];

    if (subject_id) {
      params.push(subject_id);
      whereClause += ` AND q.subject_id = $${params.length}`;
    }
    if (year) {
      params.push(year);
      whereClause += ` AND q.year = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND q.question_text ILIKE $${params.length}`;
    }

    params.push(limit, offset);
    const result = await query(
      `SELECT q.*, s.name AS subject_name
       FROM questions q JOIN subjects s ON s.id = q.subject_id
       ${whereClause}
       ORDER BY q.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const totalRes = await query(
      `SELECT COUNT(*) FROM questions q ${whereClause}`,
      params.slice(0, -2)
    );

    return res.json({
      questions:  result.rows,
      pagination: { page: +page, limit: +limit, total: +totalRes.rows[0].count },
    });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/admin/questions/:id ──────────────────────────

async function deleteQuestion(req, res, next) {
  try {
    const { id } = req.params;
    await query(
      'UPDATE questions SET is_active = false WHERE id = $1',
      [id]
    );
    return res.json({ message: 'Question removed.' });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/dashboard ──────────────────────────────────

async function getDashboard(req, res, next) {
  try {
    const [users, questions, sessions, codes, recentSessions] = await Promise.all([
      query(`SELECT
               COUNT(*) FILTER (WHERE role = 'student')          AS total_students,
               COUNT(*) FILTER (WHERE activation_status = 'active' AND role = 'student') AS active_students,
               COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days' AND role = 'student') AS new_this_week
             FROM users`),
      query(`SELECT COUNT(*) AS total,
               COUNT(*) FILTER (WHERE is_active = true) AS active,
               COUNT(DISTINCT subject_id) AS subjects_covered
             FROM questions`),
      query(`SELECT COUNT(*) AS total,
               COUNT(*) FILTER (WHERE status = 'submitted') AS completed,
               ROUND(AVG(percentage_score)::NUMERIC, 2) AS avg_score
             FROM exam_sessions WHERE status != 'abandoned'`),
      query(`SELECT COUNT(*) AS total,
               COUNT(*) FILTER (WHERE is_used = false AND is_active = true) AS available,
               COUNT(*) FILTER (WHERE is_used = true) AS used
             FROM activation_codes`),
      query(`SELECT es.id, es.status, es.percentage_score, es.submitted_at,
               u.full_name, u.email
             FROM exam_sessions es
             JOIN users u ON u.id = es.user_id
             WHERE es.status IN ('submitted','timed_out')
             ORDER BY es.submitted_at DESC LIMIT 5`),
    ]);

    return res.json({
      users:           users.rows[0],
      questions:       questions.rows[0],
      sessions:        sessions.rows[0],
      activation_codes: codes.rows[0],
      recent_sessions: recentSessions.rows,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  upload,
  generateActivationCodes,
  listActivationCodes,
  deactivateCode,
  listStudents,
  toggleStudentStatus,
  addQuestionManual,
  uploadQuestions,
  listQuestions,
  deleteQuestion,
  getDashboard,
};
