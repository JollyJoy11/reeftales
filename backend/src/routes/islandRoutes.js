const express = require('express')
const router = express.Router()

const {
  fetchIslands,
  fetchIslandById,
  fetchIslandCommunityMedia,
  fetchIslandJournals,
  fetchIslandResidentSpecies
} = require('../controllers/islandController')

router.get('/', fetchIslands)
router.get('/:id/community-media', fetchIslandCommunityMedia)
router.get('/:id/journals', fetchIslandJournals)
router.get('/:id/resident-species', fetchIslandResidentSpecies)
router.get('/:id', fetchIslandById)

module.exports = router