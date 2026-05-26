const express = require('express')
const router = express.Router()

const { fetchActivities } = require('../controllers/activityController')

router.get('/', fetchActivities)

module.exports = router