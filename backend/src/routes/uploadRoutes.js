const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

const uploadDir = path.join(__dirname, '..', 'uploads', 'journals')

fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const safeName = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()

    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName || 'journal-media'}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: {
    files: 12,
    fileSize: 25 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true)
      return
    }

    cb(new Error('Only image and video uploads are allowed.'))
  }
})

router.post('/journal-media', authMiddleware, upload.array('files', 12), (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`

  res.status(201).json({
    files: (req.files || []).map(file => ({
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `${baseUrl}/uploads/journals/${file.filename}`
    }))
  })
})

module.exports = router
