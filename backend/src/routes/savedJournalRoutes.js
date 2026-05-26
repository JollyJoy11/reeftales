const express = require('express')
const router = express.Router()

const authMiddleware = require('../middleware/authMiddleware')

const {
  fetchSavedJournals,
  toggleSavedJournal
} = require('../controllers/savedJournalController')

router.get('/', authMiddleware, fetchSavedJournals)
router.post('/:journalId/toggle', authMiddleware, toggleSavedJournal)

module.exports = router