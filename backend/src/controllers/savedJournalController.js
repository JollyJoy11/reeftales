const {
  saveJournal,
  unsaveJournal,
  isJournalSaved,
  getSavedJournals
} = require('../models/savedJournalModel')

async function fetchSavedJournals(req, res) {
  try {
    const journals = await getSavedJournals(req.user.id)
    res.json(journals)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch saved journals' })
  }
}

async function toggleSavedJournal(req, res) {
  try {
    const userId = req.user.id
    const journalId = req.params.journalId

    const saved = await isJournalSaved(userId, journalId)

    if (saved) {
      await unsaveJournal(userId, journalId)
      return res.json({ saved: false })
    }

    await saveJournal(userId, journalId)
    res.json({ saved: true })
  } catch (error) {
    res.status(500).json({ message: 'Failed to update saved journal' })
  }
}

module.exports = {
  fetchSavedJournals,
  toggleSavedJournal
}