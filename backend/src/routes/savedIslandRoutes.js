const express = require('express')
const router = express.Router()

const { protect } = require('../middleware/authMiddleware')

const {
  fetchSavedIslands,
  toggleSavedIsland
} = require('../controllers/savedIslandController')

router.get('/', protect, fetchSavedIslands)
router.post('/:islandId/toggle', protect, toggleSavedIsland)

module.exports = router