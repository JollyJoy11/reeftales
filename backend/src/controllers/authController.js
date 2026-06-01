const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const {
  findUserByEmail,
  createUser,
  findUserById,
  updateUserProfile,
  updateUserSettings
} = require('../models/userModel')

async function register(req, res) {
  try {
    const {
      username,
      email,
      password
    } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'All fields are required'
      })
    }

    const existingUser = await findUserByEmail(email)

    if (existingUser) {
      return res.status(400).json({
        message: 'Email already exists'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const userId = await createUser(username, email, hashedPassword)

    res.status(201).json({
      message: 'User registered successfully',
      userId
    })

  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: 'Server error'
    })
  }
}

async function login(req, res) {
  try {
    const {
      email,
      password
    } = req.body

    const user = await findUserByEmail(email)

    if (!user) {
      return res.status(401).json({
        message: 'Invalid username or password'
      })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid username or password'
      })
    }

    const token = jwt.sign(
      {
        id: user.id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    )

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profile_image: user.profile_image,
        bio: user.bio,
        appearance_theme: user.appearance_theme,
        font_size: user.font_size,
        larger_text: user.larger_text,
        reduced_motion: user.reduced_motion,
        high_contrast: user.high_contrast,
        notify_likes: user.notify_likes,
        notify_comments: user.notify_comments,
        default_journal_visibility: user.default_journal_visibility,
        language: user.language,
        created_at: user.created_at
      }
    })

  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: 'Server error'
    })
  }
}

async function getCurrentUser(
  req,
  res
) {
  try {
    const user = await findUserById(req.user.id)
    res.json(user)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: 'Server error'
    })
  }
}

async function updateProfile(req, res) {
  try {
    const username = req.body.username?.trim()

    if (!username) {
      return res.status(400).json({ message: 'Username is required' })
    }

    const user = await updateUserProfile(req.user.id, {
      username,
      bio: req.body.bio?.trim() || '',
      profile_image: req.body.profile_image?.trim() || ''
    })

    res.json(user)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to update profile' })
  }
}

async function updateSettings(req, res) {
  try {
    const user = await updateUserSettings(req.user.id, {
      appearance_theme: ['light', 'dark'].includes(req.body.appearance_theme)
        ? req.body.appearance_theme
        : 'light',
      font_size: ['small', 'normal', 'large'].includes(req.body.font_size)
        ? req.body.font_size
        : 'normal',
      larger_text: Boolean(req.body.larger_text),
      reduced_motion: Boolean(req.body.reduced_motion),
      high_contrast: Boolean(req.body.high_contrast),
      notify_likes: Boolean(req.body.notify_likes),
      notify_comments: Boolean(req.body.notify_comments),
      default_journal_visibility: ['public', 'private'].includes(req.body.default_journal_visibility)
        ? req.body.default_journal_visibility
        : 'public',
      language: ['English', 'Bahasa Melayu', '中文'].includes(req.body.language)
        ? req.body.language
        : 'English'
    })

    res.json(user)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to update settings' })
  }
}

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
  updateSettings
}
