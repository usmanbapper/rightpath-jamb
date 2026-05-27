const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();

const { redeemCode, getStatus } = require('../controllers/activation.controller');
const { authenticate, requireEmailVerified } = require('../middleware/auth.middleware');

function validate(req, res, next) {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: errors.array()[0].msg });
  next();
}

// All activation routes require a logged-in, verified user
router.use(authenticate, requireEmailVerified);

router.post('/redeem',
  [body('code').trim().notEmpty().withMessage('Activation code is required.')],
  validate,
  redeemCode
);

router.get('/status', getStatus);

module.exports = router;
