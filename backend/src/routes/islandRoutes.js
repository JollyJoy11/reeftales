const express = require('express')
const router = express.Router()

const {
  fetchIslands,
  fetchIslandById
} = require('../controllers/islandController')

router.get('/', fetchIslands)
router.get('/:id', fetchIslandById)

module.exports = router