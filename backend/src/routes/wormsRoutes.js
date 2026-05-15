const express = require('express')
const router = express.Router()

const { searchWorms } = require('../controllers/wormsController')

router.get('/search', searchWorms)

module.exports = router
