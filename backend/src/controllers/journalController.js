const {
  getPublicJournals,
  getJournalById,
  getTrendingIslands,
  getTopExplorers
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

module.exports = {
  fetchPublicJournals,
  fetchJournalById,
  fetchTrendingIslands,
  fetchTopExplorers
}