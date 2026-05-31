const express = require('express')
const router = express.Router()

const {
  fetchSpecies,
  fetchSpeciesById,
  fetchSpeciesOccurrences
} = require('../controllers/speciesController')

router.get('/', fetchSpecies)
router.get('/:id/occurrences', fetchSpeciesOccurrences)
router.get('/:id', fetchSpeciesById)

module.exports = router