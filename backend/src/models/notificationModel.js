const db = require('../config/db')

async function createNotification({ userId, actorId, journalId, type, message }) {
  if (!userId || Number(userId) === Number(actorId)) return null

  const [result] = await db.query(`
    INSERT INTO notifications (user_id, actor_id, journal_id, type, message)
    VALUES (?, ?, ?, ?, ?)
  `, [userId, actorId || null, journalId || null, type, message])

  return result.insertId
}

async function getUserNotifications(userId) {
  const [rows] = await db.query(`
    SELECT
      notifications.id,
      notifications.type,
      notifications.message,
      notifications.is_read,
      notifications.created_at,
      notifications.journal_id,
      journals.title AS journal_title,
      users.username AS actor_name,
      users.profile_image AS actor_image
    FROM notifications
    LEFT JOIN users ON notifications.actor_id = users.id
    LEFT JOIN journals ON notifications.journal_id = journals.id
    WHERE notifications.user_id = ?
    ORDER BY notifications.created_at DESC
    LIMIT 20
  `, [userId])

  return rows
}

async function markNotificationRead(notificationId, userId) {
  const [result] = await db.query(`
    UPDATE notifications
    SET is_read = TRUE
    WHERE id = ? AND user_id = ?
  `, [notificationId, userId])

  return result.affectedRows > 0
}

async function markAllNotificationsRead(userId) {
  await db.query(`
    UPDATE notifications
    SET is_read = TRUE
    WHERE user_id = ?
  `, [userId])
}

async function getJournalNotificationContext(journalId) {
  const [rows] = await db.query(`
    SELECT
      journals.id,
      journals.title,
      journals.user_id AS owner_id,
      users.notify_likes,
      users.notify_comments
    FROM journals
    JOIN users ON journals.user_id = users.id
    WHERE journals.id = ?
  `, [journalId])

  return rows[0]
}

module.exports = {
  createNotification,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getJournalNotificationContext
}
