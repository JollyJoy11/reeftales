const express = require('express')
const router = express.Router()

const authMiddleware = require('../middleware/authMiddleware')

const {
  fetchSavedIslands,
  toggleSavedIsland
} = require('../controllers/savedIslandController')

router.get('/', authMiddleware, fetchSavedIslands)
router.post('/:islandId/toggle', authMiddleware, toggleSavedIsland)

module.exports = router