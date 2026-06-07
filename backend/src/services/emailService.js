async function sendPasswordResetEmail({ to, resetLink }) {
  const apiKey = process.env.BREVO_API_KEY

  if (!apiKey) {
    return { sent: false, reason: 'BREVO_API_KEY is not configured.' }
  }

  const from = process.env.SMTP_FROM || 'Reef Tales <noreply@reeftales.app>'
  const fromMatch = from.match(/^"?([^<"]+?)"?\s*<([^>]+)>$/)
  const senderName = fromMatch ? fromMatch[1].trim() : 'Reef Tales'
  const senderEmail = fromMatch ? fromMatch[2].trim() : from.replace(/^.*<|>.*$/g, '').trim()

  const body = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to }],
    subject: 'Reset your Reef Tales password',
    textContent: [
      'You requested a password reset for your Reef Tales account.',
      '',
      `Open this link to set a new password: ${resetLink}`,
      '',
      'This link expires in 30 minutes. If you did not request this, you can ignore this email.'
    ].join('\n'),
    htmlContent: `
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
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Brevo API error ${response.status}: ${error}`)
  }

  return { sent: true }
}

module.exports = { sendPasswordResetEmail }
