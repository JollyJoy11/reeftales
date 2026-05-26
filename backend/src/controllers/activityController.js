const { getAllActivities } = require('../models/activityModel')

async function fetchActivities(req, res) {
  try {
    const activities = await getAllActivities()
    res.json(activities)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch activities' })
  }
}

module.exports = {
  fetchActivities
}