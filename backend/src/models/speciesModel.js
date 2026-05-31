const db = require('../config/db')

async function getAllSpecies(filters = {}) {
  let sql = `
    SELECT *
    FROM species
    WHERE 1=1
  `

  const values = []

  if (filters.search) {
    sql += `
      AND (
        name LIKE ?
        OR scientific_name LIKE ?
        OR category LIKE ?
        OR tags LIKE ?
      )
    `

    values.push(
      `%${filters.search}%`,
      `%${filters.search}%`,
      `%${filters.search}%`,
      `%${filters.search}%`
    )
  }

  if (filters.categories?.length) {
    sql += `
      AND category IN (${filters.categories.map(() => '?').join(',')})
    `

    values.push(...filters.categories)
  }

  if (filters.minDepth !== undefined && filters.minDepth !== '') {
    sql += `
      AND max_depth >= ?
    `

    values.push(Number(filters.minDepth))
  }

  if (filters.maxDepth !== undefined && filters.maxDepth !== '') {
    sql += `
      AND min_depth <= ?
    `

    values.push(Number(filters.maxDepth))
  }

  sql += ` ORDER BY name ASC`

  const [rows] = await db.query(sql, values)
  return rows
}

async function getSpeciesById(id) {
  const [rows] = await db.query(`
    SELECT *
    FROM species
    WHERE id = ?
  `, [id])

  return rows[0]
}

async function getSpeciesLocalSummary(speciesId) {
  const [rows] = await db.query(`
    SELECT
      COUNT(DISTINCT journal_sightings.id) AS local_sighting_count,
      COUNT(DISTINCT journals.island_id) AS local_island_count,
      COUNT(DISTINCT journal_media.id) AS local_media_count
    FROM species
    LEFT JOIN journal_sightings
      ON species.id = journal_sightings.species_id
    LEFT JOIN journals
      ON journal_sightings.journal_id = journals.id
      AND journals.visibility = 'public'
    LEFT JOIN journal_media
      ON species.id = journal_media.species_id
    WHERE species.id = ?
  `, [speciesId])

  return rows[0]
}

async function getSpeciesMedia(speciesId) {
  const [rows] = await db.query(`
    SELECT
      journal_media.id,
      journal_media.media_url,
      journal_media.media_type,
      journal_media.caption,
      journals.id AS journal_id,
      journals.title AS journal_title,
      islands.name AS island_name,
      users.username
    FROM journal_media
    INNER JOIN journals
      ON journal_media.journal_id = journals.id
    INNER JOIN islands
      ON journals.island_id = islands.id
    INNER JOIN users
      ON journals.user_id = users.id
    WHERE journal_media.species_id = ?
      AND journals.visibility = 'public'
    ORDER BY journal_media.created_at DESC
    LIMIT 8
  `, [speciesId])

  return rows
}

module.exports = {
  getAllSpecies,
  getSpeciesById,
  getSpeciesLocalSummary,
  getSpeciesMedia
}
