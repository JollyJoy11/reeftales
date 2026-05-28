const {
  getPublicJournals,
  getJournalById,
  getTrendingIslands,
  getTopExplorers,
  createJournal
} = require('../models/journalModel')

async function fetchPublicJournals(req, res) {
  try {
    const journals = await getPublicJournals({
      search: req.query.search
    })

    res.json(journals)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch journals' })
  }
}

async function fetchJournalById(req, res) {
  try {
    const journal = await getJournalById(req.params.id)

    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' })
    }

    res.json(journal)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch journal' })
  }
}

async function fetchTrendingIslands(req, res) {
  try {
    const islands = await getTrendingIslands()
    res.json(islands)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch trending islands' })
  }
}

async function fetchTopExplorers(req, res) {
  try {
    const explorers = await getTopExplorers()
    res.json(explorers)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch top explorers' })
  }
}

async function addJournal(req, res) {
  try {
    const journalId = await createJournal({
      user_id: req.user.id,
      island_id: req.body.island_id,
      title: req.body.title,
      content: req.body.content,
      cover_image: req.body.cover_image,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      mood: req.body.mood,
      visibility: req.body.visibility,
      layout_items: req.body.layout_items || [],
      activities: req.body.activities || [],
      sightings: req.body.sightings || [],
      media: req.body.media || []
    })

    res.status(201).json({
      message: 'Journal created successfully',
      journalId
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Failed to create journal',
      details: process.env.NODE_ENV === 'production'
        ? undefined
        : error.sqlMessage || error.message
    })
  }
}

module.exports = {
  fetchPublicJournals,
  fetchJournalById,
  fetchTrendingIslands,
  fetchTopExplorers,
  addJournal
}
