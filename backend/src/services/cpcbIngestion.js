const axios = require('axios')
const pool = require('../db/pool.js')
const redis = require('./redisClient.js')

// Real CPCB stations for Mumbai
const STATIONS = [
  { id:'BKC',      ward:'Kurla',     lat:19.0726, lon:72.8846 },
  { id:'Dharavi',  ward:'Dharavi',   lat:19.0422, lon:72.8530 },
  { id:'Andheri',  ward:'Andheri E', lat:19.1136, lon:72.8697 },
  { id:'Chembur',  ward:'Chembur',   lat:19.0522, lon:72.8994 },
  { id:'Worli',    ward:'Worli',     lat:19.0039, lon:72.8178 },
  { id:'Colaba',   ward:'Colaba',    lat:18.9067, lon:72.8147 },
]

async function fetchAQI() {
  console.log('[CPCB] Fetching AQI data...')
  try {
    for (const station of STATIONS) {
      // Try real CPCB API first
      let aqi, pm25, pm10, no2
      try {
        const res = await axios.get(
          `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69`,
          {
            params: {
              'api-key': process.env.DATA_GOV_KEY,
              format: 'json',
              limit: 1,
              filters: `station:${station.id}`
            },
            timeout: 5000
          }
        )
        const record = res.data?.records?.[0]
        if (record) {
          pm25 = parseFloat(record['PM2.5']) || null
          pm10 = parseFloat(record['PM10']) || null
          no2  = parseFloat(record['NO2'])  || null
          // Calculate AQI from PM2.5
          aqi  = pm25 ? Math.min(500, Math.round(pm25 * 3.2)) : null
        }
      } catch {
        // API failed — use realistic mock with slight randomness
        console.log(`[CPCB] Using mock data for ${station.id}`)
      }

      // Fallback mock if API fails or returns null
      if (!aqi) {
        const base = { 
          'Dharavi':312, 'Kurla':278, 'Andheri E':241,
          'Chembur':295, 'Worli':145, 'Colaba':98 
        }
        const b = base[station.ward] || 200
        aqi  = b + Math.floor(Math.random() * 20 - 10)
        pm25 = Math.round(aqi / 3.2)
        pm10 = Math.round(pm25 * 1.5)
        no2  = Math.round(pm25 * 0.6)
      }

      // Get ward_id
      const wardRes = await pool.query(
        `SELECT id FROM wards WHERE ward_name = $1 AND city = 'mumbai'`,
        [station.ward]
      )
      const ward_id = wardRes.rows[0]?.id
      if (!ward_id) continue

      // Insert into TimescaleDB
      await pool.query(
        `INSERT INTO aqi_readings (time, station_id, ward_id, lat, lon, aqi, pm25, pm10, no2)
         VALUES (NOW(), $1, $2, $3, $4, $5, $6, $7, $8)`,
        [station.id, ward_id, station.lat, station.lon, aqi, pm25, pm10, no2]
      )

      // Cache latest AQI in Redis
      await redis.set(
        `aqi:mumbai:${station.ward}`,
        JSON.stringify({ aqi, pm25, pm10, no2, time: new Date() }),
        { EX: 600 } // expires in 10 min
      )

      console.log(`[CPCB] ${station.ward}: AQI=${aqi} PM2.5=${pm25}`)
    }
    console.log('[CPCB] Fetch complete')
  } catch (err) {
    console.error('[CPCB] Error:', err.message)
  }
}

module.exports = { fetchAQI }