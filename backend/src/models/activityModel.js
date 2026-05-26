const db = require('../config/db')

async function getAllActivities() {
  const [rows] = await db.query(`
    SELECT *
    FROM activities
    ORDER BY name ASC
  `)

  return rows
}

module.exports = {
  getAllActivities
}