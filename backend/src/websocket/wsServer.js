const { WebSocketServer } = require('ws')
const pool = require('../db/pool.js')

function initWebSocket(server) {
  const wss = new WebSocketServer({ server })

  wss.on('connection', (ws) => {
    console.log('[WS] Client connected')

    // Send both cities on connect
    sendLatestAQI(ws, 'mumbai')
    sendLatestAQI(ws, 'delhi')

    ws.on('message', async (msg) => {
      try {
        const { type, city } = JSON.parse(msg)
        if (type === 'SUBSCRIBE_CITY') {
          sendLatestAQI(ws, city)
        }
      } catch (err) {}
    })

    const ping = setInterval(() => {
      if (ws.readyState === ws.OPEN) ws.ping()
    }, 30000)

    ws.on('close', () => {
      clearInterval(ping)
    })
  })

  // Broadcast all cities every 60s
  setInterval(async () => {
    if (wss.clients.size === 0) return
    for (const city of ['mumbai', 'delhi', 'bengaluru', 'kolkata']) {
      const data = await getLatestAQI(city)
      const payload = JSON.stringify({ type: 'AQI_UPDATE', city, data })
      wss.clients.forEach(client => {
        if (client.readyState === 1) client.send(payload)
      })
    }
  }, 60000)
}

async function getLatestAQI(city) {
  const result = await pool.query(
    `SELECT w.id, w.ward_name, w.city,
            COALESCE(a.aqi, 0) as aqi,
            COALESCE(a.pm25, 0) as pm25,
            COALESCE(a.pm10, 0) as pm10
     FROM wards w
     LEFT JOIN LATERAL (
       SELECT aqi, pm25, pm10 FROM aqi_readings
       WHERE ward_id = w.id
       ORDER BY time DESC LIMIT 1
     ) a ON true
     WHERE w.city = $1`,
    [city]
  )
  return result.rows
}

async function sendLatestAQI(ws, city) {
  try {
    const data = await getLatestAQI(city)
    ws.send(JSON.stringify({ type: 'AQI_UPDATE', city, data }))
  } catch (err) {
    console.error('[WS] Send error:', err.message)
  }
}

module.exports = { initWebSocket }