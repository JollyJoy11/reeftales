const nodemailer = require('nodemailer')

function hasSmtpConfig() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_FROM
  )
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })
}

async function sendPasswordResetEmail({ to, resetLink }) {
  if (!hasSmtpConfig()) {
    return { sent: false, reason: 'SMTP is not configured.' }
  }

  const transporter = createTransporter()

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: 'Reset your Reef Tales password',
    text: [
      'You requested a password reset for your Reef Tales account.',
      '',
      `Open this link to set a new password: ${resetLink}`,
      '',
      'This link expires in 30 minutes. If you did not request this, you can ignore this email.'
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; color: #234; line-height: 1.6;">
        <h2 style="color: #1897a0;">Reset your Reef Tales password</h2>
        <p>You requested a password reset for your Reef Tales account.</p>
        <p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 18px; border-radius: 999px; background: #1897a0; color: #ffffff; text-decoration: none; font-weight: 700;">
            Set a new password
          </a>
        </p>
        <p>This link expires in 30 minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `
  })

  return { sent: true }
}

module.exports = {
  hasSmtpConfig,
  sendPasswordResetEmail
}
