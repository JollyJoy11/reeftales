const express = require('express')
const multer = require('multer')
const jwt = require('jsonwebtoken')
const router = express.Router()

const {
  searchWorms,
  identifyImage,
  fetchMyIdentifications
} = require('../controllers/wormsController')
const { protect, optionalAuth } = require('../middleware/authMiddleware')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
})

router.get('/search', searchWorms)
router.get('/identifications/me', protect, fetchMyIdentifications)
router.post('/identify-image', optionalAuth, upload.single('image'), identifyImage)

module.exports = router
