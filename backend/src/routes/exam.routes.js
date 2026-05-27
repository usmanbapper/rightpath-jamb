const express = require('express');
const { body, param } = require('express-validator');
const router  = express.Router();

const {
  getSubjects, getExamConfigs,
  startExam, saveAnswer, flagQuestion, syncTime, submitExam,
  getHistory, getReview,
} = require('../controllers/exam.controller');

const {
  authenticate, requireActivation, requireEmailVerified,
} = require('../middleware/auth.middleware');

function validate(req, res, next) {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: errors.array()[0].msg });
  next();
}

// Public info routes (auth still needed to know user state)
router.get('/subjects', authenticate, getSubjects);
router.get('/configs',  authenticate, getExamConfigs);

// Exam-taking routes — require activation
const guard = [authenticate, requireEmailVerified, requireActivation];

router.post('/start',
  ...guard,
  [body('subject_ids').isArray({ min: 4, max: 4 }).withMessage('Exactly 4 subjects required.')],
  validate,
  startExam
);

router.patch('/:sessionId/answer',
  ...guard,
  [
    param('sessionId').isUUID(),
    body('exam_question_id').isUUID().withMessage('Valid exam_question_id required.'),
    body('selected_answer').optional().isIn(['A','B','C','D']),
  ],
  validate,
  saveAnswer
);

router.patch('/:sessionId/flag',
  ...guard,
  [param('sessionId').isUUID(), body('exam_question_id').isUUID()],
  validate,
  flagQuestion
);

router.patch('/:sessionId/sync-time',
  ...guard,
  [param('sessionId').isUUID(), body('time_remaining_seconds').isInt({ min: 0 })],
  validate,
  syncTime
);

router.post('/:sessionId/submit',
  ...guard,
  [param('sessionId').isUUID()],
  validate,
  submitExam
);

router.get('/history', ...guard, getHistory);
router.get('/:sessionId/review', authenticate, requireEmailVerified, getReview);

module.exports = router;
