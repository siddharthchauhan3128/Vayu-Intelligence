const express = require('express')
const router = express.Router()
const pool = require('../db/pool.js')

// GET /api/wards?city=mumbai — returns wards with latest AQI
router.get('/', async (req, res) => {
  try {
    const { city = 'mumbai' } = req.query
    const result = await pool.query(
      `SELECT w.id, w.ward_name, w.city, w.population, w.land_use_type,
              COALESCE(a.aqi, 0) as aqi,
              COALESCE(a.pm25, 0) as pm25,
              COALESCE(a.pm10, 0) as pm10
       FROM wards w
       LEFT JOIN LATERAL (
         SELECT aqi, pm25, pm10 FROM aqi_readings
         WHERE ward_id = w.id
         ORDER BY time DESC LIMIT 1
       ) a ON true
       WHERE w.city = $1
       ORDER BY w.ward_name`,
      [city]
    )
    res.json({ success: true, data: result.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/wards/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.*, COALESCE(a.aqi, 0) as aqi, COALESCE(a.pm25, 0) as pm25
       FROM wards w
       LEFT JOIN LATERAL (
         SELECT aqi, pm25 FROM aqi_readings
         WHERE ward_id = w.id
         ORDER BY time DESC LIMIT 1
       ) a ON true
       WHERE w.id = $1`,
      [req.params.id]
    )
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Ward not found' })
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router