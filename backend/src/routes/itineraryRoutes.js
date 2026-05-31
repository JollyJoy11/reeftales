const express = require('express')
const router = express.Router()

const {
  fetchItineraries,
  fetchItineraryById,
  addItinerary,
  editItinerary,
  removeItinerary
} = require('../controllers/itineraryController')

const { protect } = require('../middleware/authMiddleware')

router.get('/', protect, fetchItineraries)
router.post('/', protect, addItinerary)
router.get('/:id', protect, fetchItineraryById)
router.put('/:id', protect, editItinerary)
router.delete('/:id', protect, removeItinerary)

module.exports = router
