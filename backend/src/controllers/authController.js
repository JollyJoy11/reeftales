const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const {
  findUserByEmail,
  createUser,
  findUserById
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
        email: user.email
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

module.exports = {
  register,
  login,
  getCurrentUser
}