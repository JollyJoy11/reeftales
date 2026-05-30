const db = require('../config/db')

async function createAiIdentification(userId, data) {
  const [result] = await db.query(`
    INSERT INTO ai_identifications
    (
      user_id,
      image_url,
      common_name,
      scientific_name,
      confidence,
      reason,
      aphia_id,
      accepted_name,
      taxonomy_status,
      rank_name,
      worms_url
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    userId,
    data.imageUrl || null,
    data.commonName || null,
    data.scientificName || null,
    data.confidence || null,
    data.reason || null,
    data.aphiaId || null,
    data.acceptedName || null,
    data.taxonomyStatus || null,
    data.rankName || null,
    data.wormsUrl || null
  ])

  return result.insertId
}

async function getUserAiIdentifications(userId) {
  const [rows] = await db.query(`
    SELECT *
    FROM ai_identifications
    WHERE user_id = ?
    ORDER BY created_at DESC
  `, [userId])

  return rows
}

module.exports = {
  createAiIdentification,
  getUserAiIdentifications
}
