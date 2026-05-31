const express = require('express');
const { body, param } = require('express-validator');
const router  = express.Router();

const {
  upload,
  generateActivationCodes, listActivationCodes, deactivateCode,
  listStudents, toggleStudentStatus,
  addQuestionManual, uploadQuestions, listQuestions, deleteQuestion,
  getDashboard,
} = require('../controllers/admin.controller');

const { getSubjects } = require('../controllers/exam.controller');

const { authenticate, requireRole } = require('../middleware/auth.middleware');

function validate(req, res, next) {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: errors.array()[0].msg });
  next();
}

// All admin routes: must be logged in + admin or superadmin
router.use(authenticate, requireRole('admin', 'superadmin'));

// ── Dashboard ─────────────────────────────────────────────────
router.get('/dashboard', getDashboard);

// ── Activation codes ──────────────────────────────────────────
router.post('/activation-codes/generate',
  [
    body('count').optional().isInt({ min: 1, max: 500 }),
    body('valid_days').optional().isInt({ min: 1, max: 365 }),
  ],
  validate,
  generateActivationCodes
);
router.get('/activation-codes', listActivationCodes);
router.delete('/activation-codes/:id', deactivateCode);

// ── Students ──────────────────────────────────────────────────
router.get('/students', listStudents);
router.patch('/students/:id/toggle', toggleStudentStatus);

// ── Questions ─────────────────────────────────────────────────
router.get('/subjects', getSubjects);
router.get('/questions', listQuestions);

router.post('/questions/manual',
  [
    body('subject_id').isUUID().withMessage('Valid subject_id required.'),
    body('question_text').trim().notEmpty().withMessage('question_text required.'),
    body('option_a').trim().notEmpty(),
    body('option_b').trim().notEmpty(),
    body('option_c').trim().notEmpty(),
    body('option_d').trim().notEmpty(),
    body('correct_answer').isIn(['A','B','C','D']).withMessage('correct_answer must be A, B, C, or D.'),
  ],
  validate,
  addQuestionManual
);

router.post('/questions/upload',
  upload.single('file'),
  uploadQuestions
);

router.delete('/questions/:id', deleteQuestion);

module.exports = router;
