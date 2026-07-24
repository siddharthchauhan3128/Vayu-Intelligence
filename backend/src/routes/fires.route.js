const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Reference coordinates for major cities to base our 500km radius on
const CITY_COORDS = {
  'mumbai': { lat: 19.0760, lon: 72.8777 },
  'delhi': { lat: 28.6139, lon: 77.2090 }
};

// GET /api/fires?city=mumbai
router.get('/', async (req, res) => {
  try {
    const cityName = (req.query.city || 'mumbai').toLowerCase();
    const coords = CITY_COORDS[cityName];

   if (!coords) {
      return res.status(400).json({ success: false, error: 'City not supported or invalid.' });
    }

    const client = await pool.connect();
    
    try {
      // FIRST CHECK: Does the table even exist yet?
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'fire_hotspots'
        );
      `);

      if (!tableCheck.rows[0].exists) {
        // Table hasn't been created by the ingestion service yet. Return empty data safely.
        console.warn('⚠️ fire_hotspots table does not exist yet. Returning empty array.');
        return res.json({
          success: true,
          city: cityName,
          radius_km: 500,
          count: 0,
          data: [],
          message: "Fire data ingestion is pending."
        });
      }

      // We use the Haversine formula to calculate the great-circle distance between 
      // the city center and the fire hotspots, filtering for those <= 500km.
      // We also filter for high/nominal confidence fires in the last 24 hours.
      const query = `
        SELECT 
          id, 
          latitude, 
          longitude, 
          brightness, 
          frp, 
          confidence, 
          acq_time,
          (
            6371 * acos(
              cos(radians($1)) * cos(radians(latitude)) * 
              cos(radians(longitude) - radians($2)) + 
              sin(radians($1)) * sin(radians(latitude))
            )
          ) AS distance_km
        FROM fire_hotspots 
        WHERE ingested_at >= NOW() - INTERVAL '24 HOURS'
        AND confidence IN ('h', 'n')
        AND (
            6371 * acos(
              cos(radians($1)) * cos(radians(latitude)) * 
              cos(radians(longitude) - radians($2)) + 
              sin(radians($1)) * sin(radians(latitude))
            )
        ) <= 500
        ORDER BY distance_km ASC;
      `;
      
      // Pass the city latitude and longitude securely to prevent SQL injection
      const result = await client.query(query, [coords.lat, coords.lon]);
      
      res.json({
        success: true,
        city: cityName,
        radius_km: 500,
        count: result.rowCount,
        data: result.rows
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Error fetching fire hotspots:', error);
    res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch fire data',
        details: error.message
    });
  }
});

module.exports = router;