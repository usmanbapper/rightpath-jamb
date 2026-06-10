const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || 'Rightpath Academy <onboarding@resend.dev>';

// ── Helpers ──────────────────────────────────────────────────
function baseTemplate(title, bodyHtml) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin:0; padding:0; background:#f4f6f9; font-family: 'Segoe UI', sans-serif; }
    .wrapper { max-width:600px; margin:40px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.08); }
    .header { background:linear-gradient(135deg,#1a56db,#0e3fa8); padding:32px 40px; text-align:center; }
    .header h1 { margin:0; color:#fff; font-size:24px; }
    .header p  { margin:4px 0 0; color:rgba(255,255,255,.75); font-size:14px; }
    .body { padding:40px; color:#333; line-height:1.7; }
    .body h2 { margin-top:0; color:#1a56db; }
    .btn { display:inline-block; margin:24px 0; padding:14px 32px; background:#1a56db; color:#fff !important; text-decoration:none; border-radius:8px; font-weight:600; font-size:16px; }
    .footer { background:#f8fafc; padding:20px 40px; text-align:center; color:#6b7280; font-size:13px; border-top:1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🎯 Rightpath Learners Academy JAMB</h1>
      <p>Your JAMB Success Partner</p>
    </div>
    <div class="body">
      ${bodyHtml}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Rightpath JAMB. All rights reserved.</p>
      <p>If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Public API ───────────────────────────────────────────────

async function sendVerificationEmail(to, fullName, token) {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const html = baseTemplate('Verify Your Email', `
    <h2>Welcome, ${fullName}! 👋</h2>
    <p>Thanks for signing up for Rightpath JAMB. Please verify your email address to activate your account and start practising.</p>
    <p style="text-align:center">
      <a href="${verifyUrl}" class="btn">Verify Email Address</a>
    </p>
    <p style="color:#6b7280;font-size:13px">This link expires in <strong>24 hours</strong>. If the button doesn't work, copy and paste this URL into your browser:</p>
    <p style="word-break:break-all;font-size:13px;color:#1a56db">${verifyUrl}</p>
  `);

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: '✅ Verify your Rightpath JAMB account',
    html,
  });

  if (error) throw new Error(error.message);
}

async function sendPasswordResetEmail(to, fullName, token) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const html = baseTemplate('Reset Your Password', `
    <h2>Reset Your Password 🔐</h2>
    <p>Hi ${fullName}, we received a request to reset your Rightpath JAMB password.</p>
    <p style="text-align:center">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </p>
    <p style="color:#6b7280;font-size:13px">This link expires in <strong>1 hour</strong>. If you didn't request a password reset, please ignore this email — your account is safe.</p>
  `);

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: '🔐 Reset your Rightpath JAMB password',
    html,
  });

  if (error) throw new Error(error.message);
}

async function sendWelcomeEmail(to, fullName) {
  const html = baseTemplate('Welcome to Rightpath JAMB!', `
    <h2>You're all set, ${fullName}! 🎉</h2>
    <p>Your email has been verified. You can now log in and start your JAMB preparation journey.</p>
    <p>Here's what you can do on Rightpath JAMB:</p>
    <ul>
      <li>📝 Take full JAMB mock exams with real past questions</li>
      <li>📊 Track your performance across subjects</li>
      <li>🏆 Earn badges as you improve</li>
      <li>🔁 Review your answers after every exam</li>
    </ul>
    <p style="text-align:center">
      <a href="${process.env.FRONTEND_URL}/login" class="btn">Go to Dashboard</a>
    </p>
    <p style="color:#6b7280;font-size:13px">
      <strong>Note:</strong> You'll need an activation code to start taking exams. 
      Contact your school or purchase one from our website.
    </p>
  `);

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: '🎉 Welcome to Rightpath JAMB!',
    html,
  });

  if (error) throw new Error(error.message);
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail };