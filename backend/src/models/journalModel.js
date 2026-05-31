const db = require('../config/db')

async function getPublicJournals(filters = {}, userId = null) {
  let sql = `
    SELECT 
      journals.id,
      journals.title,
      journals.content,
      journals.cover_image,
      DATE_FORMAT(journals.start_date, '%Y-%m-%d') AS start_date,
      DATE_FORMAT(journals.end_date, '%Y-%m-%d') AS end_date,
      journals.mood,
      journals.created_at,

      users.username,
      users.profile_image,

      islands.name AS island_name,
      islands.country,
      islands.cover_image AS island_cover_image,

      COUNT(DISTINCT likes.id) AS like_count,
      COUNT(DISTINCT comments.id) AS comment_count,

      EXISTS (
        SELECT 1
        FROM likes user_likes
        WHERE user_likes.journal_id = journals.id
          AND user_likes.user_id = ?
      ) AS is_liked,

      EXISTS (
        SELECT 1
        FROM saved_journals
        WHERE saved_journals.journal_id = journals.id
          AND saved_journals.user_id = ?
      ) AS is_saved,

      GROUP_CONCAT(DISTINCT COALESCE(activities.name, journal_activities.custom_activity_name)) AS activities,
      GROUP_CONCAT(DISTINCT COALESCE(species.name, journal_sightings.custom_species_name)) AS species
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

  const values = [userId || 0, userId || 0]

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

async function getUserJournals(userId) {
  const [rows] = await db.query(`
    SELECT
      journals.id,
      journals.island_id,
      journals.title,
      journals.content,
      journals.cover_image,
      journals.start_date,
      journals.end_date,
      journals.mood,
      journals.visibility,
      journals.created_at,

      users.username,
      users.profile_image,

      islands.name AS island_name,
      islands.country,
      islands.cover_image AS island_cover_image,

      (
        SELECT COUNT(*)
        FROM likes
        WHERE likes.journal_id = journals.id
      ) AS like_count,

      (
        SELECT COUNT(*)
        FROM comments
        WHERE comments.journal_id = journals.id
      ) AS comment_count,

      (
        SELECT COUNT(*)
        FROM journal_media
        WHERE journal_media.journal_id = journals.id
      ) AS media_count,

      (
        SELECT COUNT(*)
        FROM journal_sightings
        WHERE journal_sightings.journal_id = journals.id
      ) AS sighting_count,

      (
        SELECT GROUP_CONCAT(DISTINCT COALESCE(species.name, journal_sightings.custom_species_name))
        FROM journal_sightings
        LEFT JOIN species ON journal_sightings.species_id = species.id
        WHERE journal_sightings.journal_id = journals.id
      ) AS species,

      (
        SELECT GROUP_CONCAT(journal_media.media_url ORDER BY journal_media.display_order ASC, journal_media.id ASC SEPARATOR '||')
        FROM journal_media
        WHERE journal_media.journal_id = journals.id
      ) AS media_urls,

      (
        SELECT GROUP_CONCAT(journal_media.media_type ORDER BY journal_media.display_order ASC, journal_media.id ASC SEPARATOR '||')
        FROM journal_media
        WHERE journal_media.journal_id = journals.id
      ) AS media_types
    FROM journals
    JOIN users ON journals.user_id = users.id
    JOIN islands ON journals.island_id = islands.id
    WHERE journals.user_id = ?
    ORDER BY journals.created_at DESC
  `, [userId])

  return rows
}

async function getUserJournalSummary(userId) {
  const [rows] = await db.query(`
    SELECT
      (
        SELECT COUNT(*)
        FROM journals
        WHERE journals.user_id = ?
      ) AS journal_count,
      (
        SELECT COUNT(*)
        FROM journals
        WHERE journals.user_id = ? AND journals.visibility = 'public'
      ) AS public_count,
      (
        SELECT COUNT(*)
        FROM journal_media
        JOIN journals ON journal_media.journal_id = journals.id
        WHERE journals.user_id = ?
      ) AS media_count,
      (
        SELECT COUNT(DISTINCT COALESCE(species.name, journal_sightings.custom_species_name))
        FROM journal_sightings
        JOIN journals ON journal_sightings.journal_id = journals.id
        LEFT JOIN species ON journal_sightings.species_id = species.id
        WHERE journals.user_id = ?
      ) AS species_count
  `, [userId, userId, userId, userId])

  return rows[0]
}

async function getJournalById(id, userId = null) {
  const [rows] = await db.query(`
    SELECT 
      journals.*,
      users.username,
      users.profile_image,
      islands.name AS island_name,
      islands.country,
      islands.cover_image AS island_cover_image,
      COUNT(DISTINCT likes.id) AS like_count,
      COUNT(DISTINCT comments.id) AS comment_count,

      EXISTS (
        SELECT 1
        FROM likes user_likes
        WHERE user_likes.journal_id = journals.id
          AND user_likes.user_id = ?
      ) AS is_liked,

      EXISTS (
        SELECT 1
        FROM saved_journals
        WHERE saved_journals.journal_id = journals.id
          AND saved_journals.user_id = ?
      ) AS is_saved

    FROM journals
    JOIN users ON journals.user_id = users.id
    JOIN islands ON journals.island_id = islands.id
    LEFT JOIN likes ON likes.journal_id = journals.id
    LEFT JOIN comments ON comments.journal_id = journals.id
    WHERE journals.id = ?
    GROUP BY journals.id
  `, [userId || 0, userId || 0, id])

  if (!rows[0]) return null

  let layoutItems = []

  try {
    layoutItems = rows[0].layout_json ? JSON.parse(rows[0].layout_json) : []
  } catch {
    layoutItems = []
  }

  const [media] = await db.query(`
    SELECT
      journal_media.*,
      COALESCE(species.name, journal_media.custom_species_name) AS species_name,
      COALESCE(activities.name, journal_media.custom_activity_name) AS activity_name
    FROM journal_media
    LEFT JOIN species ON journal_media.species_id = species.id
    LEFT JOIN activities ON journal_media.activity_id = activities.id
    WHERE journal_media.journal_id = ?
    ORDER BY journal_media.display_order ASC, journal_media.id ASC
  `, [id])

  const [activities] = await db.query(`
    SELECT
      journal_activities.*,
      activities.name AS activity_name
    FROM journal_activities
    LEFT JOIN activities ON journal_activities.activity_id = activities.id
    WHERE journal_activities.journal_id = ?
    ORDER BY journal_activities.day_number ASC, journal_activities.activity_time ASC, journal_activities.id ASC
  `, [id])

  const [sightings] = await db.query(`
    SELECT
      journal_sightings.*,
      species.name AS species_name
    FROM journal_sightings
    LEFT JOIN species ON journal_sightings.species_id = species.id
    WHERE journal_sightings.journal_id = ?
    ORDER BY journal_sightings.id ASC
  `, [id])

  const [comments] = await db.query(`
    SELECT
      comments.*,
      users.username,
      users.profile_image
    FROM comments
    JOIN users ON comments.user_id = users.id
    WHERE comments.journal_id = ?
      AND comments.parent_comment_id IS NULL
    ORDER BY comments.created_at DESC, comments.id DESC
  `, [id])

  return {
    ...rows[0],
    layout_items: layoutItems,
    media,
    activities,
    sightings,
    comments
  }
}

async function addComment(journalId, userId, content) {
  const [result] = await db.query(`
    INSERT INTO comments (user_id, journal_id, content)
    VALUES (?, ?, ?)
  `, [userId, journalId, content])

  return result.insertId
}

async function isJournalLiked(userId, journalId) {
  const [rows] = await db.query(`
    SELECT id
    FROM likes
    WHERE user_id = ? AND journal_id = ?
  `, [userId, journalId])

  return Boolean(rows[0])
}

async function likeJournal(userId, journalId) {
  await db.query(`
    INSERT IGNORE INTO likes (user_id, journal_id)
    VALUES (?, ?)
  `, [userId, journalId])
}

async function unlikeJournal(userId, journalId) {
  await db.query(`
    DELETE FROM likes
    WHERE user_id = ? AND journal_id = ?
  `, [userId, journalId])
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

async function createJournal(data) {
  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const [journalResult] = await connection.query(`
      INSERT INTO journals
      (
        user_id,
        island_id,
        title,
        content,
        cover_image,
        start_date,
        end_date,
        mood,
        visibility,
        layout_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.user_id,
      data.island_id,
      data.title,
      data.content,
      data.cover_image,
      data.start_date,
      data.end_date,
      data.mood,
      data.visibility,
      JSON.stringify(data.layout_items || [])
    ])

    const journalId = journalResult.insertId

    if (data.activities?.length) {
      for (const activity of data.activities) {
        await connection.query(`
          INSERT INTO journal_activities
          (
            journal_id,
            activity_id,
            custom_activity_name,
            day_number,
            activity_time,
            notes
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          journalId,
          activity.activity_id || null,
          activity.custom_activity_name || null,
          activity.day_number || null,
          activity.activity_time || null,
          activity.notes || null
        ])
      }
    }

    if (data.sightings?.length) {
      for (const sighting of data.sightings) {
        await connection.query(`
          INSERT INTO journal_sightings
          (
            journal_id,
            species_id,
            custom_species_name,
            quantity,
            notes
          )
          VALUES (?, ?, ?, ?, ?)
        `, [
          journalId,
          sighting.species_id || null,
          sighting.custom_species_name || null,
          sighting.quantity || 1,
          sighting.notes || null
        ])
      }
    }

    if (data.media?.length) {
      for (const item of data.media) {
        await connection.query(`
          INSERT INTO journal_media
          (
            journal_id,
            species_id,
            activity_id,
            custom_species_name,
            custom_activity_name,
            media_url,
            media_type,
            caption,
            display_order
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          journalId,
          item.species_id || null,
          item.activity_id || null,
          item.custom_species_name || null,
          item.custom_activity_name || null,
          item.media_url,
          item.media_type || 'photo',
          item.caption || null,
          item.display_order || 0
        ])
      }
    }

    await connection.commit()
    return journalId
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

module.exports = {
  getPublicJournals,
  getUserJournals,
  getUserJournalSummary,
  getJournalById,
  getTrendingIslands,
  getTopExplorers,
  createJournal,
  addComment,
  isJournalLiked,
  likeJournal,
  unlikeJournal
}
