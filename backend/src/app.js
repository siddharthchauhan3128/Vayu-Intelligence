require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cron = require('node-cron')
const { createServer } = require('http')
const { initWebSocket } = require('./websocket/wsServer.js')
const { fetchAQI } = require('./services/cpcbIngestion.js')
const { fetchWeather } = require('./services/weatherIngestion.js')

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'vayu-backend' })
})

app.use('/api/wards', require('./routes/wards.routes.js'))

// Cron: fetch AQI every 5 min
cron.schedule('*/5 * * * *', fetchAQI)

// Cron: fetch weather every 30 min
cron.schedule('*/30 * * * *', fetchWeather)

// Run once on startup
fetchAQI()
fetchWeather()

const server = createServer(app)
initWebSocket(server)

server.listen(process.env.NODE_PORT || 3001, () =>
  console.log(`Vayu backend on :${process.env.NODE_PORT || 3001}`)
)