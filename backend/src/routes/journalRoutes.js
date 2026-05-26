const express = require('express')
const router = express.Router()

const {
  fetchPublicJournals,
  fetchJournalById,
  fetchTrendingIslands,
  fetchTopExplorers,
  addJournal
} = require('../controllers/journalController')

const authMiddleware = require('../middleware/authMiddleware')

router.get('/', fetchPublicJournals)
router.post('/', authMiddleware, addJournal)
router.get('/:id', fetchJournalById)
router.get('/trending/islands', fetchTrendingIslands)
router.get('/top/explorers', fetchTopExplorers)

module.exports = router