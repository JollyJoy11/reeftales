const {
  getAllIslands,
  getIslandById
} = require('../models/islandModel')

async function fetchIslands(req, res) {
  try {
    const islands = await getAllIslands({
      search: req.query.search,

      continents:
        req.query.continents
          ? req.query.continents.split(',')
          : [],

      activities:
        req.query.activities
          ? req.query.activities.split(',')
          : []
    })

    res.json(islands)

  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: 'Failed to fetch islands'
    })
  }
}

async function fetchIslandById(req, res) {
  try {
    const island = await getIslandById(req.params.id)

    if (!island) {
      return res.status(404).json({ message: 'Island not found' })
    }

    res.json(island)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch island' })
  }
}

module.exports = {
  fetchIslands,
  fetchIslandById
}