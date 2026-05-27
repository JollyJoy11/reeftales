const express = require('express')
const router = express.Router()

const {
  getWeather,
  getMarineWeather
} = require('../controllers/weatherController')

router.get('/', getWeather)
router.get('/marine', getMarineWeather)

module.exports = router