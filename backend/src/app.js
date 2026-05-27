const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/authRoutes')
const islandRoutes = require('./routes/islandRoutes')
const speciesRoutes = require('./routes/speciesRoutes')
const wormsRoutes = require('./routes/wormsRoutes')
const weatherRoutes = require('./routes/weatherRoutes')
const journalRoutes = require('./routes/journalRoutes')
const savedIslandRoutes = require('./routes/savedIslandRoutes')
const savedJournalRoutes = require('./routes/savedJournalRoutes')
const activityRoutes = require('./routes/activityRoutes')

const app = express()

// middleware
app.use(cors())
app.use(express.json({ limit: '25mb' }))

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
app.use('/api/saved-islands', savedIslandRoutes)
app.use('/api/saved-journals', savedJournalRoutes)
app.use('/api/activities', activityRoutes)

module.exports = app
