const express = require('express')
const router = express.Router()

const {
  fetchSpecies,
  fetchSpeciesById
} = require('../controllers/speciesController')

router.get('/', fetchSpecies)
router.get('/:id', fetchSpeciesById)

module.exports = router