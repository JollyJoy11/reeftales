const {
  getAllSpecies,
  getSpeciesById
} = require('../models/speciesModel')

async function fetchSpecies(req, res) {
  try {
    const species = await getAllSpecies({
      search: req.query.search,
      categories: req.query.categories
        ? req.query.categories.split(',')
        : [],
      minDepth: req.query.minDepth,
      maxDepth: req.query.maxDepth
    })

    res.json(species)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch species' })
  }
}

async function fetchSpeciesById(req, res) {
  try {
    const species = await getSpeciesById(req.params.id)

    if (!species) {
      return res.status(404).json({ message: 'Species not found' })
    }

    res.json(species)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch species' })
  }
}

module.exports = {
  fetchSpecies,
  fetchSpeciesById
}
