const express = require('express')
const multer = require('multer')
const jwt = require('jsonwebtoken')
const router = express.Router()

const {
  searchWorms,
  identifyImage,
  fetchMyIdentifications
} = require('../controllers/wormsController')
const authMiddleware = require('../middleware/authMiddleware')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
})

function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (authHeader?.startsWith('Bearer ')) {
      req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET)
    }
  } catch {
    req.user = null
  }

  next()
}

router.get('/search', searchWorms)
router.get('/identifications/me', authMiddleware, fetchMyIdentifications)
router.post('/identify-image', optionalAuth, upload.single('image'), identifyImage)

module.exports = router
