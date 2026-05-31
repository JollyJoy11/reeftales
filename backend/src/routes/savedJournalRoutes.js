const express = require('express')
const router = express.Router()

const { protect } = require('../middleware/authMiddleware')

const {
  fetchSavedJournals,
  toggleSavedJournal
} = require('../controllers/savedJournalController')

router.get('/', protect, fetchSavedJournals)
router.post('/:journalId/toggle', protect, toggleSavedJournal)

module.exports = router