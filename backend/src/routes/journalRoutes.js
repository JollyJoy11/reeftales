const express = require('express')
const router = express.Router()

const {
  fetchPublicJournals,
  fetchJournalById,
  fetchTrendingIslands,
  fetchTopExplorers
} = require('../controllers/journalController')

router.get('/', fetchPublicJournals)
router.get('/:id', fetchJournalById)
router.get('/trending/islands', fetchTrendingIslands)
router.get('/top/explorers', fetchTopExplorers)

module.exports = router