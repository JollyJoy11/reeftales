const db = require('../config/db')

async function saveJournal(userId, journalId) {
  await db.query(
    `INSERT IGNORE INTO saved_journals (user_id, journal_id) VALUES (?, ?)`,
    [userId, journalId]
  )
}

async function unsaveJournal(userId, journalId) {
  await db.query(
    `DELETE FROM saved_journals WHERE user_id = ? AND journal_id = ?`,
    [userId, journalId]
  )
}

async function isJournalSaved(userId, journalId) {
  const [rows] = await db.query(
    `SELECT id FROM saved_journals WHERE user_id = ? AND journal_id = ?`,
    [userId, journalId]
  )

  return rows.length > 0
}

async function getSavedJournals(userId) {
  const [rows] = await db.query(`
    SELECT 
      journals.*,
      users.username,
      users.profile_image,
      islands.name AS island_name,
      islands.country
    FROM saved_journals
    JOIN journals ON saved_journals.journal_id = journals.id
    JOIN users ON journals.user_id = users.id
    JOIN islands ON journals.island_id = islands.id
    WHERE saved_journals.user_id = ?
    ORDER BY saved_journals.created_at DESC
  `, [userId])

  return rows
}

module.exports = {
  saveJournal,
  unsaveJournal,
  isJournalSaved,
  getSavedJournals
}