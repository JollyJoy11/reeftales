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
      bio
    FROM users
    WHERE id = ?
    `,
    [id]
  )

  return rows[0]
}

module.exports = {
  findUserByEmail,
  createUser,
  findUserById
}