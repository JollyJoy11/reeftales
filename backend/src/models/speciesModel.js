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

module.exports = {
  getAllSpecies,
  getSpeciesById
}