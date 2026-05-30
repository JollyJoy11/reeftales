const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { v2: cloudinary } = require('cloudinary')

const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

const uploadDir = path.join(__dirname, '..', 'uploads', 'journals')
const useCloudinary = process.env.USE_CLOUDINARY === 'true'

fs.mkdirSync(uploadDir, { recursive: true })

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  })
}

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

const localUpload = multer({
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

const cloudUpload = multer({
  storage: multer.memoryStorage(),
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

const upload = useCloudinary ? cloudUpload : localUpload

function uploadToCloudinary(file) {
  const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image'

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'reeftales/journals',
        resource_type: resourceType
      },
      (error, result) => {
        if (error) {
          reject(error)
          return
        }

        resolve(result)
      }
    )

    stream.end(file.buffer)
  })
}

router.post('/journal-media', authMiddleware, upload.array('files', 12), async (req, res) => {
  if (useCloudinary) {
    try {
      const uploads = await Promise.all(
        (req.files || []).map(async file => {
          const result = await uploadToCloudinary(file)

          return {
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            url: result.secure_url,
            publicId: result.public_id
          }
        })
      )

      return res.status(201).json({
        files: uploads
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        message: 'Failed to upload media.'
      })
    }
  }

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
