const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const redis = require('../services/redisClient')
const { getForecast } = require('../services/mlClient')

// GET /api/forecast/:wardId
router.get('/:wardId', async (req, res) => {
  try {
    const { wardId } = req.params

    // Check Redis cache first
    const cached = await redis.get(`forecast:${wardId}`)
    if (cached) {
      return res.json({ success: true, cached: true, data: JSON.parse(cached) })
    }

    // Get ward name + current AQI
    const wardRes = await pool.query(
      `SELECT w.ward_name,
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

    const { ward_name, aqi } = wardRes.rows[0]
    const forecast = await getForecast(ward_name, aqi, 72)

    // Cache for 1 hour
    await redis.set(`forecast:${wardId}`, JSON.stringify(forecast), { EX: 3600 })

    res.json({ success: true, cached: false, data: forecast })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router