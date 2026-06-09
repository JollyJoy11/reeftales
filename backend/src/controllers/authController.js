const bcrypt = require('bcrypt')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')

const {
  findUserByEmail,
  createUser,
  findUserById,
  updateUserProfile,
  updateUserSettings,
  savePasswordResetToken,
  findUserByPasswordResetToken,
  updatePasswordAndClearReset
} = require('../models/userModel')
const { sendPasswordResetEmail } = require('../services/emailService')

function hashResetToken(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex')
}

function isEnabled(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').toLowerCase())
}

function normalizeLanguage(language) {
  return ['zh', '中文', 'ä¸­æ–‡'].includes(language)
    ? '中文'
    : 'English'
}

function getHostname(value) {
  try {
    return new URL(value).hostname
  } catch {
    return ''
  }
}

function isLocalUrl(value) {
  const hostname = getHostname(value)
  return ['localhost', '127.0.0.1', '::1'].includes(hostname)
}

function getRequestOrigin(req) {
  const origin = req.get('origin')
  if (origin) return origin

  const referer = req.get('referer')
  if (!referer) return ''

  try {
    const url = new URL(referer)
    return `${url.protocol}//${url.host}`
  } catch {
    return ''
  }
}

function getFrontendUrl(req) {
  const configuredUrl =
    process.env.FRONTEND_URL ||
    process.env.PUBLIC_FRONTEND_URL ||
    process.env.CLIENT_URL ||
    ''
  const requestOrigin = getRequestOrigin(req)

  if (
    process.env.NODE_ENV === 'production' &&
    configuredUrl &&
    isLocalUrl(configuredUrl) &&
    requestOrigin
  ) {
    return requestOrigin
  }

  return configuredUrl || requestOrigin || 'http://localhost:5173'
}

function isStrongPassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    password.length <= 16 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  )
}

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
        color_scheme: user.color_scheme,
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
      color_scheme: ['teal', 'sunset'].includes(req.body.color_scheme)
        ? req.body.color_scheme
        : 'teal',
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
      language: normalizeLanguage(req.body.language)
    })

    res.json(user)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: error.message || 'Failed to update settings' })
  }
}

async function forgotPassword(req, res) {
  try {
    const email = req.body.email?.trim().toLowerCase()

    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    const user = await findUserByEmail(email)
    const response = {
      message: 'If that email exists, a password reset link has been sent.'
    }

    if (!user) {
      return res.json(response)
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = hashResetToken(resetToken)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30)

    await savePasswordResetToken(user.id, tokenHash, expiresAt)

    const frontendUrl = getFrontendUrl(req)
    const resetLink = `${frontendUrl.replace(/\/$/, '')}/reset-password/${resetToken}`

    let emailResult = { sent: false, reason: 'Email was not attempted.' }

    try {
      emailResult = await sendPasswordResetEmail({
        to: user.email,
        resetLink
      })
    } catch (emailError) {
      console.error('Password reset email failed:', emailError)
      emailResult = {
        sent: false,
        reason: 'Email delivery failed.'
      }
    }

    if (
      !emailResult.sent &&
      (process.env.NODE_ENV !== 'production' || isEnabled(process.env.RETURN_PASSWORD_RESET_LINK))
    ) {
      response.resetLink = resetLink
    }

    res.json(response)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to prepare password reset.' })
  }
}

async function resetPassword(req, res) {
  try {
    const token = req.params.token
    const password = req.body.password

    if (!token) {
      return res.status(400).json({ message: 'Reset token is required' })
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message: 'Password must be 8-16 characters and include uppercase, lowercase, and a number.'
      })
    }

    const tokenHash = hashResetToken(token)
    const user = await findUserByPasswordResetToken(tokenHash)

    if (!user) {
      return res.status(400).json({
        message: 'This reset link is invalid or has expired.'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    await updatePasswordAndClearReset(user.id, hashedPassword)

    res.json({ message: 'Password reset successfully.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to reset password.' })
  }
}

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
  updateSettings,
  forgotPassword,
  resetPassword
}

