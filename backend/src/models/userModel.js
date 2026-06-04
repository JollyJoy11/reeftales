const db = require('../config/db')

async function findUserByEmail(email) {
  const [rows] = await db.query(
    `
    SELECT *
    FROM users
    WHERE email = ?
    `,
    [email]
  )

  return rows[0]
}

async function createUser(
  username,
  email,
  password
) {
  const [result] = await db.query(
    `
    INSERT INTO users
    (
      username,
      email,
      password
    )
    VALUES (?, ?, ?)
    `,
    [username, email, password]
  )

  return result.insertId
}

async function findUserById(id) {
  const [rows] = await db.query(
    `
    SELECT
      id,
      username,
      email,
      profile_image,
      bio,
      appearance_theme,
      color_scheme,
      font_size,
      larger_text,
      reduced_motion,
      high_contrast,
      notify_likes,
      notify_comments,
      default_journal_visibility,
      language,
      created_at
    FROM users
    WHERE id = ?
    `,
    [id]
  )

  return rows[0]
}

async function updateUserProfile(userId, data) {
  await db.query(
    `
    UPDATE users
    SET username = ?, bio = ?, profile_image = ?
    WHERE id = ?
    `,
    [
      data.username,
      data.bio || null,
      data.profile_image || null,
      userId
    ]
  )

  return findUserById(userId)
}

async function updateUserSettings(userId, data) {
  await db.query(
    `
    UPDATE users
    SET
      appearance_theme = ?,
      color_scheme = ?,
      font_size = ?,
      larger_text = ?,
      reduced_motion = ?,
      high_contrast = ?,
      notify_likes = ?,
      notify_comments = ?,
      default_journal_visibility = ?,
      language = ?
    WHERE id = ?
    `,
    [
      data.appearance_theme,
      data.color_scheme,
      data.font_size,
      data.larger_text,
      data.reduced_motion,
      data.high_contrast,
      data.notify_likes,
      data.notify_comments,
      data.default_journal_visibility,
      data.language,
      userId
    ]
  )

  return findUserById(userId)
}

async function savePasswordResetToken(userId, tokenHash, expiresAt) {
  await db.query(
    `
    UPDATE users
    SET reset_password_token_hash = ?, reset_password_expires_at = ?
    WHERE id = ?
    `,
    [tokenHash, expiresAt, userId]
  )
}

async function findUserByPasswordResetToken(tokenHash) {
  const [rows] = await db.query(
    `
    SELECT *
    FROM users
    WHERE reset_password_token_hash = ?
      AND reset_password_expires_at > NOW()
    LIMIT 1
    `,
    [tokenHash]
  )

  return rows[0]
}

async function updatePasswordAndClearReset(userId, hashedPassword) {
  await db.query(
    `
    UPDATE users
    SET
      password = ?,
      reset_password_token_hash = NULL,
      reset_password_expires_at = NULL
    WHERE id = ?
    `,
    [hashedPassword, userId]
  )
}

module.exports = {
  findUserByEmail,
  createUser,
  findUserById,
  updateUserProfile,
  updateUserSettings,
  savePasswordResetToken,
  findUserByPasswordResetToken,
  updatePasswordAndClearReset
}
