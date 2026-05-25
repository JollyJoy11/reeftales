const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/authRoutes')
const islandRoutes = require('./routes/islandRoutes')
const speciesRoutes = require('./routes/speciesRoutes')
const wormsRoutes = require('./routes/wormsRoutes')
const weatherRoutes = require('./routes/weatherRoutes')
const journalRoutes = require('./routes/journalRoutes')

const app = express()

// middleware
app.use(cors())
app.use(express.json())

// test route
app.get('/', (req, res) => {
  res.send('API is running...')
})

// routes
app.use('/api/auth', authRoutes)
app.use('/api/islands', islandRoutes)
app.use('/api/species', speciesRoutes)
app.use('/api/worms', wormsRoutes)
app.use('/api/weather', weatherRoutes)
app.use('/api/journals', journalRoutes)

module.exports = app
