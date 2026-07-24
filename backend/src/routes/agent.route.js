const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const redis = require('../services/redisClient.js')
const { getAttribution } = require('../services/mlClient.js')
const { runAttributionAgent } = require('../agents/attributionAgent.js')

// POST /api/agent/attribute/:wardId
router.post('/attribute/:wardId', async (req, res) => {
  try {
    const { wardId } = req.params

    // Check cache — agent responses cached 1h
    const cached = await redis.get(`agent:attribution:${wardId}`)
    if (cached) {
      return res.json({ success: true, cached: true, data: JSON.parse(cached) })
    }

    // Get ward data
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

    const { ward_name, land_use_type, city, aqi } = wardRes.rows[0]

    // Get ML attribution
    const attribution = await getAttribution(ward_name, land_use_type, aqi)

    // Run Claude agent
    const explanation = await runAttributionAgent(
      ward_name, city, aqi,
      attribution.sources,
      land_use_type
    )

    const result = {
      ward: ward_name,
      city,
      aqi,
      sources: attribution.sources,
      top_source: attribution.top_source,
      explanation,
      generated_at: new Date().toISOString()
    }

    // Cache 1 hour
    await redis.set(`agent:attribution:${wardId}`, JSON.stringify(result), { EX: 3600 })

    res.json({ success: true, cached: false, data: result })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router