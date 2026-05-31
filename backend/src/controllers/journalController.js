const {
  getPublicJournals,
  getUserJournals,
  getUserJournalSummary,
  getJournalById,
  getTrendingIslands,
  getTopExplorers,
  createJournal,
  addComment,
  isJournalLiked,
  likeJournal,
  unlikeJournal
} = require('../models/journalModel')

async function fetchPublicJournals(req, res) {
  try {
    const journals = await getPublicJournals(
      {
        search: req.query.search
      },
      req.user?.id || 0
    )

    res.json(journals)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch journals' })
  }
}

async function fetchMyJournals(req, res) {
  try {
    const journals = await getUserJournals(req.user.id)
    res.json(journals)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch your journals' })
  }
}

async function fetchMyJournalSummary(req, res) {
  try {
    const summary = await getUserJournalSummary(req.user.id)
    res.json(summary)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch your journal summary' })
  }
}

async function fetchJournalById(req, res) {
  try {
    const journal = await getJournalById(req.params.id, req.user?.id || 0)

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

async function addJournalComment(req, res) {
  try {
    const content = req.body.content?.trim()

    if (!content) {
      return res.status(400).json({ message: 'Comment cannot be empty' })
    }

    const commentId = await addComment(req.params.id, req.user.id, content)

    res.status(201).json({
      message: 'Comment added successfully',
      commentId
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to add comment' })
  }
}

async function toggleJournalLike(req, res) {
  try {
    const userId = req.user.id
    const journalId = req.params.id
    const liked = await isJournalLiked(userId, journalId)

    if (liked) {
      await unlikeJournal(userId, journalId)
      return res.json({ liked: false })
    }

    await likeJournal(userId, journalId)
    res.json({ liked: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to update journal like' })
  }
}

module.exports = {
  fetchPublicJournals,
  fetchMyJournals,
  fetchMyJournalSummary,
  fetchJournalById,
  fetchTrendingIslands,
  fetchTopExplorers,
  addJournal,
  addJournalComment,
  toggleJournalLike
}
