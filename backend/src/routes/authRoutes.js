const express = require('express')

const router = express.Router()

const {
  register,
  login,
  getCurrentUser,
  updateProfile,
  updateSettings
} = require('../controllers/authController')

const { protect } = require('../middleware/authMiddleware')

router.post('/register', register)
router.post('/login', login)
router.get('/me', protect, getCurrentUser)
router.put('/me/profile', protect, updateProfile)
router.put('/me/settings', protect, updateSettings)

module.exports = router
