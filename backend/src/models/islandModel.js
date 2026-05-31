const db = require('../config/db')

async function getAllIslands(filters = {}) {
  let sql = `
    SELECT
      islands.*,
      GROUP_CONCAT(DISTINCT activities.name) AS activities,
      GROUP_CONCAT(DISTINCT species.name) AS species
    FROM islands

    LEFT JOIN island_activities
      ON islands.id = island_activities.island_id

    LEFT JOIN activities
      ON island_activities.activity_id = activities.id

    LEFT JOIN journals
      ON islands.id = journals.island_id

    LEFT JOIN journal_sightings
      ON journals.id = journal_sightings.journal_id

    LEFT JOIN species
      ON journal_sightings.species_id = species.id

    WHERE 1=1
  `

  const values = []

  // SEARCH
  if (filters.search) {
    sql += `
      AND (
        islands.name LIKE ?
        OR islands.location LIKE ?
        OR islands.continent LIKE ?
      )
    `

    values.push(
      `%${filters.search}%`,
      `%${filters.search}%`,
      `%${filters.search}%`
    )
  }

  // CONTINENTS
  if (filters.continents?.length) {
    sql += `
      AND islands.continent IN (${filters.continents.map(() => '?').join(',')})
    `

    values.push(...filters.continents)
  }

  // ACTIVITIES
  if (filters.activities?.length) {
    sql += `
      AND activities.name IN (${filters.activities.map(() => '?').join(',')})
    `

    values.push(...filters.activities)
  }

  sql += `
    GROUP BY islands.id
    ORDER BY islands.name ASC
  `

  const [rows] = await db.query(sql, values)

  return rows
}

async function getIslandById(id) {
  const [rows] = await db.query(`
    SELECT *
    FROM islands
    WHERE id = ?
  `, [id])

  return rows[0]
}

async function getIslandCommunityMedia(islandId) {
  const [rows] = await db.query(`
    SELECT
      journal_media.id,
      journal_media.media_url,
      journal_media.media_type,
      journal_media.caption,
      journal_media.activity_id,
      journal_media.species_id,
      journal_media.custom_activity_name,
      journal_media.custom_species_name,
      COALESCE(activities.name, journal_media.custom_activity_name) AS activity_name,
      COALESCE(species.name, journal_media.custom_species_name) AS species_name,
      journals.id AS journal_id,
      journals.title AS journal_title,
      users.username
    FROM journal_media
    INNER JOIN journals
      ON journal_media.journal_id = journals.id
    INNER JOIN users
      ON journals.user_id = users.id
    LEFT JOIN activities
      ON journal_media.activity_id = activities.id
    LEFT JOIN species
      ON journal_media.species_id = species.id
    WHERE journals.island_id = ?
      AND journals.visibility = 'public'
      AND (
        journal_media.activity_id IS NOT NULL
        OR journal_media.species_id IS NOT NULL
        OR journal_media.custom_activity_name IS NOT NULL
        OR journal_media.custom_species_name IS NOT NULL
      )
    ORDER BY journal_media.created_at DESC
    LIMIT 6
  `, [islandId])

  return rows
}

async function getIslandJournals(islandId) {
  const [rows] = await db.query(`
    SELECT
      journals.id,
      journals.title,
      journals.content,
      journals.cover_image,
      journals.mood,
      journals.start_date,
      journals.end_date,
      journals.created_at,
      users.username,
      COUNT(DISTINCT likes.id) AS like_count,
      COUNT(DISTINCT comments.id) AS comment_count
    FROM journals
    INNER JOIN users
      ON journals.user_id = users.id
    LEFT JOIN likes
      ON journals.id = likes.journal_id
    LEFT JOIN comments
      ON journals.id = comments.journal_id
    WHERE journals.island_id = ?
      AND journals.visibility = 'public'
    GROUP BY journals.id
    ORDER BY journals.created_at DESC
    LIMIT 3
  `, [islandId])

  return rows
}

async function getIslandResidentSpecies(islandId) {
  const [rows] = await db.query(`
    SELECT
      species.id,
      species.name,
      species.scientific_name AS scientificName,
      species.image_url AS image,
      species.category,
      species.conservation_status,
      species.habitats,
      species.description,
      COUNT(journal_sightings.id) AS sighting_count,
      MAX(journals.created_at) AS last_seen_at
    FROM journal_sightings
    INNER JOIN journals
      ON journal_sightings.journal_id = journals.id
    INNER JOIN species
      ON journal_sightings.species_id = species.id
    WHERE journals.island_id = ?
      AND journals.visibility = 'public'
      AND journal_sightings.species_id IS NOT NULL
    GROUP BY species.id
    ORDER BY sighting_count DESC, species.name ASC
    LIMIT 6
  `, [islandId])

  return rows
}

async function getIslandRecentSightings(islandId) {
  const [rows] = await db.query(`
    SELECT
      species.id AS species_id,
      species.name,
      species.image_url,
      journals.created_at,
      journals.id AS journal_id,
      journals.title AS journal_title,
      users.username,
      journal_sightings.quantity,
      journal_sightings.notes
    FROM journal_sightings
    INNER JOIN journals
      ON journal_sightings.journal_id = journals.id
    INNER JOIN species
      ON journal_sightings.species_id = species.id
    INNER JOIN users
      ON journals.user_id = users.id
    WHERE journals.island_id = ?
      AND journals.visibility = 'public'
      AND journal_sightings.species_id IS NOT NULL
    ORDER BY journals.created_at DESC, journal_sightings.id DESC
    LIMIT 5
  `, [islandId])

  return rows
}

async function getIslandActivities(islandId) {
  const [rows] = await db.query(`
    SELECT
      activities.id,
      activities.name,
      activities.description,
      activities.icon
    FROM island_activities
    INNER JOIN activities
      ON island_activities.activity_id = activities.id
    WHERE island_activities.island_id = ?
    ORDER BY activities.name ASC
  `, [islandId])

  return rows
}

module.exports = {
  getAllIslands,
  getIslandById,
  getIslandCommunityMedia,
  getIslandJournals,
  getIslandResidentSpecies,
  getIslandRecentSightings,
  getIslandActivities
}
