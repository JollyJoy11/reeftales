const express = require('express')
const router = express.Router()

const {
  fetchMyNotifications,
  markOneRead,
  markAllRead
} = require('../controllers/notificationController')

const { protect } = require('../middleware/authMiddleware')

router.get('/', protect, fetchMyNotifications)
router.patch('/read-all', protect, markAllRead)
router.patch('/:id/read', protect, markOneRead)

module.exports = router
