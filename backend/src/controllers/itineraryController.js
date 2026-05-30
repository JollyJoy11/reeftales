const {
  getUserItineraries,
  getItineraryById,
  createItinerary,
  updateItinerary,
  deleteItinerary
} = require('../models/itineraryModel')

function validateItinerary(body) {
  if (!body.title?.trim()) {
    return 'Trip title is required'
  }

  if (!body.island_id) {
    return 'Island is required'
  }

  if (!body.start_date || !body.end_date) {
    return 'Trip dates are required'
  }

  return null
}

async function fetchItineraries(req, res) {
  try {
    const itineraries = await getUserItineraries(req.user.id)
    res.json(itineraries)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch itineraries' })
  }
}

async function fetchItineraryById(req, res) {
  try {
    const itinerary = await getItineraryById(req.params.id, req.user.id)

    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' })
    }

    res.json(itinerary)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch itinerary' })
  }
}

async function addItinerary(req, res) {
  try {
    const validationError = validateItinerary(req.body)

    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const itineraryId = await createItinerary(req.user.id, req.body)
    res.status(201).json({ message: 'Itinerary saved', itineraryId })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to save itinerary' })
  }
}

async function editItinerary(req, res) {
  try {
    const validationError = validateItinerary(req.body)

    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const updated = await updateItinerary(req.params.id, req.user.id, req.body)

    if (!updated) {
      return res.status(404).json({ message: 'Itinerary not found' })
    }

    res.json({ message: 'Itinerary updated' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to update itinerary' })
  }
}

async function removeItinerary(req, res) {
  try {
    const deleted = await deleteItinerary(req.params.id, req.user.id)

    if (!deleted) {
      return res.status(404).json({ message: 'Itinerary not found' })
    }

    res.json({ message: 'Itinerary deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to delete itinerary' })
  }
}

module.exports = {
  fetchItineraries,
  fetchItineraryById,
  addItinerary,
  editItinerary,
  removeItinerary
}
