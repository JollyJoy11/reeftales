const db = require('../config/db')

async function saveIsland(userId, islandId) {
  await db.query(
    `INSERT IGNORE INTO saved_islands (user_id, island_id) VALUES (?, ?)`,
    [userId, islandId]
  )
}

async function unsaveIsland(userId, islandId) {
  await db.query(
    `DELETE FROM saved_islands WHERE user_id = ? AND island_id = ?`,
    [userId, islandId]
  )
}

async function isIslandSaved(userId, islandId) {
  const [rows] = await db.query(
    `SELECT id FROM saved_islands WHERE user_id = ? AND island_id = ?`,
    [userId, islandId]
  )

  return rows.length > 0
}

async function getSavedIslands(userId) {
  const [rows] = await db.query(`
    SELECT islands.*
    FROM saved_islands
    JOIN islands ON saved_islands.island_id = islands.id
    WHERE saved_islands.user_id = ?
    ORDER BY saved_islands.created_at DESC
  `, [userId])

  return rows
}

module.exports = {
  saveIsland,
  unsaveIsland,
  isIslandSaved,
  getSavedIslands
}