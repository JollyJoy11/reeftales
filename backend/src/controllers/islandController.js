const {
  getAllIslands,
  getIslandById,
  getIslandCommunityMedia,
  getIslandJournals,
  getIslandResidentSpecies,
  getIslandRecentSightings,
  getIslandActivities
} = require('../models/islandModel')

async function fetchIslands(req, res) {
  try {
    const islands = await getAllIslands({
      search: req.query.search,
      continents: req.query.continents ? req.query.continents.split(',') : [],
      activities: req.query.activities ? req.query.activities.split(',') : []
    })

    res.json(islands)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch islands' })
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

async function fetchIslandCommunityMedia(req, res) {
  try {
    const media = await getIslandCommunityMedia(req.params.id)
    res.json(media)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch island community media' })
  }
}

async function fetchIslandJournals(req, res) {
  try {
    const journals = await getIslandJournals(req.params.id)
    res.json(journals)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch island journals' })
  }
}

async function fetchIslandResidentSpecies(req, res) {
  try {
    const species = await getIslandResidentSpecies(req.params.id)
    res.json(species)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch island resident species' })
  }
}

async function fetchIslandRecentSightings(req, res) {
  try {
    const sightings = await getIslandRecentSightings(req.params.id)
    res.json(sightings)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch island recent sightings' })
  }
}

async function fetchIslandActivities(req, res) {
  try {
    const activities = await getIslandActivities(req.params.id)
    res.json(activities)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch island activities' })
  }
}

module.exports = {
  fetchIslands,
  fetchIslandById,
  fetchIslandCommunityMedia,
  fetchIslandJournals,
  fetchIslandResidentSpecies,
  fetchIslandRecentSightings,
  fetchIslandActivities
}
