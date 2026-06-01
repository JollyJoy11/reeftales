const express = require('express')
const router = express.Router()

const {
  fetchPublicJournals,
  fetchMyJournals,
  fetchMyJournalSummary,
  fetchJournalById,
  fetchTrendingIslands,
  fetchTopExplorers,
  addJournal,
  changeJournalVisibility,
  removeJournal,
  addJournalComment,
  toggleJournalLike
} = require('../controllers/journalController')

const { protect, optionalAuth } = require('../middleware/authMiddleware')

router.get('/', optionalAuth, fetchPublicJournals)
router.post('/', protect, addJournal)
router.get('/me/summary', protect, fetchMyJournalSummary)
router.get('/me/list', protect, fetchMyJournals)
router.patch('/:id/visibility', protect, changeJournalVisibility)
router.delete('/:id', protect, removeJournal)
router.post('/:id/comments', protect, addJournalComment)
router.post('/:id/like', protect, toggleJournalLike)
router.get('/trending/islands', fetchTrendingIslands)
router.get('/top/explorers', fetchTopExplorers)
router.get('/:id', optionalAuth, fetchJournalById)

module.exports = router
