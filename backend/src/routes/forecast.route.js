// backend/src/routes/forecast.js
const express = require('express')
const router = express.Router()
const pool = require('../db/pool.js')
const redis = require('../services/redisClient.js')
const { getForecast } = require('../services/mlClient.js')

router.get('/:wardId', async (req, res) => {
  const { wardId } = req.params
  const cacheKey = `forecast:${wardId}`

  try {
    const cached = await redis.get(cacheKey)
    if (cached) {
      return res.json({ success: true, cached: true, data: JSON.parse(cached) })
    }

    const wardRes = await pool.query(
      `SELECT w.ward_name, w.city,
              COALESCE(a.aqi, 150) as aqi
       FROM wards w
       LEFT JOIN LATERAL (
         SELECT aqi FROM aqi_readings
         WHERE ward_id = w.id ORDER BY time DESC LIMIT 1
       ) a ON true
       WHERE w.id = $1`,
      [wardId]
    )

    if (wardRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Ward not found' })
    }

    const { ward_name, city, aqi } = wardRes.rows[0]
    const mlData = await getForecast(ward_name, parseFloat(aqi), 72)

    const result = {
      ward_id: parseInt(wardId),
      ward: ward_name,
      city,
      current_aqi: parseFloat(aqi),
      forecast: mlData.forecast || mlData,
      generated_at: new Date().toISOString(),
    }

    await redis.set(cacheKey, JSON.stringify(result), { EX: 1800 })
    return res.json({ success: true, cached: false, data: result })

  } catch (err) {
    console.error('[forecast] Error:', err.message)
    return res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router