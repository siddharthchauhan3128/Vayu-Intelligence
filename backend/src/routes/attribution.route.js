const express = require('express')
const router = express.Router()
const pool = require('../db/pool.js')
const redis = require('../services/redisClient.js')
const { getAttribution } = require('../services/mlClient.js')

// GET /api/attribution/:wardId
router.get('/:wardId', async (req, res) => {
  try {
    const { wardId } = req.params

    // Check cache
    const cached = await redis.get(`attribution:${wardId}`)
    if (cached) {
      return res.json({ success: true, cached: true, data: JSON.parse(cached) })
    }

    // Get ward info + current AQI
    const wardRes = await pool.query(
      `SELECT w.ward_name, w.land_use_type, w.city,
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

    const { ward_name, land_use_type, aqi } = wardRes.rows[0]

    // Call ML service
    const attribution = await getAttribution(ward_name, land_use_type, aqi)

    // Cache for 30 min
    await redis.set(`attribution:${wardId}`, JSON.stringify(attribution), { EX: 1800 })

    res.json({ success: true, cached: false, data: attribution })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router