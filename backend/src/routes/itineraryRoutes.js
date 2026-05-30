const express = require('express')
const router = express.Router()

const {
  fetchItineraries,
  fetchItineraryById,
  addItinerary,
  editItinerary,
  removeItinerary
} = require('../controllers/itineraryController')

const authMiddleware = require('../middleware/authMiddleware')

router.get('/', authMiddleware, fetchItineraries)
router.post('/', authMiddleware, addItinerary)
router.get('/:id', authMiddleware, fetchItineraryById)
router.put('/:id', authMiddleware, editItinerary)
router.delete('/:id', authMiddleware, removeItinerary)

module.exports = router
