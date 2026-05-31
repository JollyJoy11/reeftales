const jwt = require('jsonwebtoken')

function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Not authorized'
      })
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid token'
    })
  }
}

function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]

      req.user = jwt.verify(
        token,
        process.env.JWT_SECRET
      )
    } else {
      req.user = null
    }
  } catch {
    req.user = null
  }

  next()
}

module.exports = {
  protect,
  optionalAuth
}