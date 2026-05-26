const {
  saveIsland,
  unsaveIsland,
  isIslandSaved,
  getSavedIslands
} = require('../models/savedIslandModel')

async function fetchSavedIslands(req, res) {
  try {
    const islands = await getSavedIslands(req.user.id)
    res.json(islands)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch saved islands' })
  }
}

async function toggleSavedIsland(req, res) {
  try {
    const userId = req.user.id
    const islandId = req.params.islandId

    const saved = await isIslandSaved(userId, islandId)

    if (saved) {
      await unsaveIsland(userId, islandId)
      return res.json({ saved: false })
    }

    await saveIsland(userId, islandId)
    res.json({ saved: true })
  } catch (error) {
    res.status(500).json({ message: 'Failed to update saved island' })
  }
}

module.exports = {
  fetchSavedIslands,
  toggleSavedIsland
}