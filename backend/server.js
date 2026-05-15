require('dotenv').config()

const app = require('./src/app')

const initializeDatabase =
  require('./src/database/initDatabase')

const PORT = process.env.PORT || 5000

async function startServer() {
  try {
    await initializeDatabase()

    app.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      )
    })

  } catch (error) {
    console.error(
      'Server startup failed:',
      error
    )
  }
}

startServer()