const express = require('express')
const multer = require('multer')
const router = express.Router()

const {
  searchWorms,
  identifyImage
} = require('../controllers/wormsController')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
})

router.get('/search', searchWorms)
router.post('/identify-image', upload.single('image'), identifyImage)

module.exports = router