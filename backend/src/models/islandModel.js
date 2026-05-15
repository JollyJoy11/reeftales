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

module.exports = {
  getAllIslands,
  getIslandById
}