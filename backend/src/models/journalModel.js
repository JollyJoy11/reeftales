const db = require('../config/db')

async function getPublicJournals(filters = {}) {
  let sql = `
    SELECT 
      journals.id,
      journals.title,
      journals.content,
      journals.cover_image,
      journals.visit_date,
      journals.mood,
      journals.created_at,

      users.username,
      users.profile_image,

      islands.name AS island_name,
      islands.country,

      COUNT(DISTINCT likes.id) AS like_count,
      COUNT(DISTINCT comments.id) AS comment_count,

      GROUP_CONCAT(DISTINCT activities.name) AS activities,
      GROUP_CONCAT(DISTINCT species.name) AS species
    FROM journals
    JOIN users ON journals.user_id = users.id
    JOIN islands ON journals.island_id = islands.id

    LEFT JOIN likes ON likes.journal_id = journals.id
    LEFT JOIN comments ON comments.journal_id = journals.id

    LEFT JOIN journal_activities ON journal_activities.journal_id = journals.id
    LEFT JOIN activities ON journal_activities.activity_id = activities.id

    LEFT JOIN journal_sightings ON journal_sightings.journal_id = journals.id
    LEFT JOIN species ON journal_sightings.species_id = species.id

    WHERE journals.visibility = 'public'
  `

  const values = []

  if (filters.search) {
    sql += `
      AND (
        journals.title LIKE ?
        OR journals.content LIKE ?
        OR islands.name LIKE ?
        OR users.username LIKE ?
        OR activities.name LIKE ?
        OR species.name LIKE ?
      )
    `

    values.push(
      `%${filters.search}%`,
      `%${filters.search}%`,
      `%${filters.search}%`,
      `%${filters.search}%`,
      `%${filters.search}%`,
      `%${filters.search}%`
    )
  }

  sql += `
    GROUP BY journals.id
    ORDER BY journals.created_at DESC
  `

  const [rows] = await db.query(sql, values)
  return rows
}

async function getJournalById(id) {
  const [rows] = await db.query(`
    SELECT 
      journals.*,
      users.username,
      users.profile_image,
      islands.name AS island_name,
      islands.country
    FROM journals
    JOIN users ON journals.user_id = users.id
    JOIN islands ON journals.island_id = islands.id
    WHERE journals.id = ?
  `, [id])

  return rows[0]
}

async function getTrendingIslands() {
  const [rows] = await db.query(`
    SELECT 
      islands.id,
      islands.name,
      islands.country,
      COUNT(journals.id) AS diary_count
    FROM journals
    JOIN islands ON journals.island_id = islands.id
    WHERE journals.visibility = 'public'
    GROUP BY islands.id
    ORDER BY diary_count DESC
    LIMIT 5
  `)

  return rows
}

async function getTopExplorers() {
  const [rows] = await db.query(`
    SELECT
      users.id,
      users.username,
      users.profile_image,
      COUNT(journals.id) AS diary_count
    FROM journals
    JOIN users ON journals.user_id = users.id
    WHERE journals.visibility = 'public'
    GROUP BY users.id
    ORDER BY diary_count DESC
    LIMIT 5
  `)

  return rows
}

module.exports = {
  getPublicJournals,
  getJournalById,
  getTrendingIslands,
  getTopExplorers
}