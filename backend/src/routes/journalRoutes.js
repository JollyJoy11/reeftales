const express = require('express')
const router = express.Router()

const {
  fetchPublicJournals,
  fetchJournalById,
  fetchTrendingIslands,
  fetchTopExplorers,
  addJournal,
  addJournalComment,
  toggleJournalLike
} = require('../controllers/journalController')

const authMiddleware = require('../middleware/authMiddleware')

router.get('/', fetchPublicJournals)
router.post('/', authMiddleware, addJournal)
router.post('/:id/comments', authMiddleware, addJournalComment)
router.post('/:id/like', authMiddleware, toggleJournalLike)
router.get('/trending/islands', fetchTrendingIslands)
router.get('/top/explorers', fetchTopExplorers)
router.get('/:id', fetchJournalById)

module.exports = router
