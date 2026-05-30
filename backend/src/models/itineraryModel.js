const db = require('../config/db')

async function getUserItineraries(userId) {
  const [rows] = await db.query(`
    SELECT
      itineraries.*,
      islands.name AS island_name,
      islands.country,
      islands.cover_image AS island_cover_image,
      islands.best_visit_time,
      (
        SELECT COUNT(*)
        FROM itinerary_activities
        WHERE itinerary_activities.itinerary_id = itineraries.id
      ) AS item_count,
      (
        SELECT COALESCE(SUM(amount), 0)
        FROM itinerary_budget_items
        WHERE itinerary_budget_items.itinerary_id = itineraries.id
      ) AS budget_total
    FROM itineraries
    LEFT JOIN islands ON itineraries.island_id = islands.id
    WHERE itineraries.user_id = ?
    ORDER BY itineraries.created_at DESC
  `, [userId])

  return rows
}

async function getItineraryById(id, userId) {
  const [rows] = await db.query(`
    SELECT
      itineraries.*,
      islands.name AS island_name,
      islands.country,
      islands.cover_image AS island_cover_image,
      islands.latitude,
      islands.longitude,
      islands.best_visit_time
    FROM itineraries
    LEFT JOIN islands ON itineraries.island_id = islands.id
    WHERE itineraries.id = ? AND itineraries.user_id = ?
  `, [id, userId])

  if (!rows[0]) return null

  const [items] = await db.query(`
    SELECT
      itinerary_activities.id,
      itinerary_activities.itinerary_id,
      itinerary_activities.activity_id,
      itinerary_activities.custom_activity_name,
      COALESCE(activities.name, itinerary_activities.custom_activity_name) AS title,
      itinerary_activities.day_number,
      itinerary_activities.activity_time AS start_time,
      itinerary_activities.duration_minutes,
      itinerary_activities.notes,
      itinerary_activities.display_order,
      activities.name AS activity_name,
      activities.icon AS activity_icon
    FROM itinerary_activities
    LEFT JOIN activities ON itinerary_activities.activity_id = activities.id
    WHERE itinerary_activities.itinerary_id = ?
    ORDER BY itinerary_activities.day_number ASC, itinerary_activities.display_order ASC, itinerary_activities.id ASC
  `, [id])

  const [checklist] = await db.query(`
    SELECT *
    FROM itinerary_checklist
    WHERE itinerary_id = ?
    ORDER BY display_order ASC, id ASC
  `, [id])

  const [budget] = await db.query(`
    SELECT *
    FROM itinerary_budget_items
    WHERE itinerary_id = ?
    ORDER BY display_order ASC, id ASC
  `, [id])

  return {
    ...rows[0],
    items,
    checklist,
    budget
  }
}

async function createItinerary(userId, data) {
  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const [result] = await connection.query(`
      INSERT INTO itineraries (user_id, title, island_id, start_date, end_date, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      userId,
      data.title,
      data.island_id || null,
      data.start_date || null,
      data.end_date || null,
      data.notes || null
    ])

    const itineraryId = result.insertId
    await replaceItineraryDetails(connection, itineraryId, data)

    await connection.commit()
    return itineraryId
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

async function updateItinerary(id, userId, data) {
  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const [result] = await connection.query(`
      UPDATE itineraries
      SET title = ?, island_id = ?, start_date = ?, end_date = ?, notes = ?
      WHERE id = ? AND user_id = ?
    `, [
      data.title,
      data.island_id || null,
      data.start_date || null,
      data.end_date || null,
      data.notes || null,
      id,
      userId
    ])

    if (!result.affectedRows) {
      await connection.rollback()
      return false
    }

    await connection.query('DELETE FROM itinerary_activities WHERE itinerary_id = ?', [id])
    await connection.query('DELETE FROM itinerary_checklist WHERE itinerary_id = ?', [id])
    await connection.query('DELETE FROM itinerary_budget_items WHERE itinerary_id = ?', [id])
    await replaceItineraryDetails(connection, id, data)

    await connection.commit()
    return true
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

async function deleteItinerary(id, userId) {
  const [result] = await db.query(`
    DELETE FROM itineraries
    WHERE id = ? AND user_id = ?
  `, [id, userId])

  return result.affectedRows > 0
}

async function replaceItineraryDetails(connection, itineraryId, data) {
  for (const [index, item] of (data.items || []).entries()) {
    await connection.query(`
      INSERT INTO itinerary_activities
      (
        itinerary_id,
        activity_id,
        custom_activity_name,
        day_number,
        activity_time,
        duration_minutes,
        notes,
        display_order
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      itineraryId,
      item.activity_id || null,
      item.title,
      item.day_number || 1,
      item.start_time || null,
      item.duration_minutes || null,
      item.notes || null,
      item.display_order ?? index
    ])
  }

  for (const [index, item] of (data.checklist || []).entries()) {
    if (!item.label) continue

    await connection.query(`
      INSERT INTO itinerary_checklist (itinerary_id, label, is_checked, display_order)
      VALUES (?, ?, ?, ?)
    `, [
      itineraryId,
      item.label,
      Boolean(item.is_checked),
      item.display_order ?? index
    ])
  }

  for (const [index, item] of (data.budget || []).entries()) {
    if (!item.label) continue

    await connection.query(`
      INSERT INTO itinerary_budget_items (itinerary_id, label, amount, display_order)
      VALUES (?, ?, ?, ?)
    `, [
      itineraryId,
      item.label,
      Number(item.amount || 0),
      item.display_order ?? index
    ])
  }

}

module.exports = {
  getUserItineraries,
  getItineraryById,
  createItinerary,
  updateItinerary,
  deleteItinerary
}
