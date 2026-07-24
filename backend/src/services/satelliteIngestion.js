const { Pool } = require('pg');
const axios = require('axios');

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
});

// NASA FIRMS MAP_KEY from environment variables (.env)
const NASA_FIRMS_KEY = process.env.NASA_FIRMS_KEY;

// Bounding box for Mumbai & surrounding region [West, South, East, North]
// Expanded slightly to catch fires blowing in from outside the immediate city
const MUMBAI_BBOX = [72.5, 18.5, 73.5, 19.5];

async function fetchAndStoreFireHotspots() {
  try {
    console.log('Initiating NASA FIRMS satellite data ingestion...');

    if (!NASA_FIRMS_KEY || NASA_FIRMS_KEY === 'your_nasa_firms_key_here') {
      console.warn('⚠️ NASA_FIRMS_KEY is missing or invalid in .env. Skipping satellite ingestion.');
      return;
    }

    // NASA FIRMS API - Area Endpoint
    // Source: VIIRS_SNPP_NRT (Suomi NPP Near Real-Time, 375m resolution)
    // Day Range: 1 (Last 24 hours)
    const areaCoords = MUMBAI_BBOX.join(',');
    const apiUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${NASA_FIRMS_KEY}/VIIRS_SNPP_NRT/${areaCoords}/1`;

    const response = await axios.get(apiUrl);
    const csvData = response.data;
    
    // Parse the CSV data
    const lines = csvData.trim().split('\n');
    if (lines.length <= 1) {
       console.log('✅ NASA FIRMS sync complete: No active fires detected in the region for the last 24 hours.');
       return;
    }

    const headers = lines[0].split(',');
    const fires = lines.slice(1).map(line => {
      const values = line.split(',');
      let fireData = {};
      headers.forEach((header, index) => {
        fireData[header.trim()] = values[index].trim();
      });
      return fireData;
    });

    // Store in PostgreSQL
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Ensure the table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS fire_hotspots (
          id SERIAL PRIMARY KEY,
          latitude DECIMAL(9,6),
          longitude DECIMAL(9,6),
          brightness DECIMAL(6,2),
          acq_date DATE,
          acq_time VARCHAR(4),
          confidence VARCHAR(10),
          frp DECIMAL(8,2),
          ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 2. Clear old data to prevent database bloat (keep only last 24 hours)
      await client.query(`DELETE FROM fire_hotspots WHERE ingested_at < NOW() - INTERVAL '24 HOURS'`);

      // 3. Insert new detections
      let insertedCount = 0;
      for (const fire of fires) {
          // Filter for only 'high' (h) or 'nominal' (n) confidence fires to prevent false positives
          if (fire.confidence === 'h' || fire.confidence === 'n') {
            const insertQuery = `
              INSERT INTO fire_hotspots 
              (latitude, longitude, brightness, acq_date, acq_time, confidence, frp) 
              VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;
            
            const values = [
                parseFloat(fire.latitude),
                parseFloat(fire.longitude),
                parseFloat(fire.brightness),
                fire.acq_date,
                fire.acq_time,
                fire.confidence,
                parseFloat(fire.frp) // Fire Radiative Power (intensity)
            ];

            await client.query(insertQuery, values);
            insertedCount++;
          }
      }

      await client.query('COMMIT');
      console.log(`✅ NASA FIRMS sync complete: Inserted ${insertedCount} verified hotspots into the database.`);

    } catch (dbError) {
      await client.query('ROLLBACK');
      console.error('❌ Database error during NASA FIRMS ingestion:', dbError);
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error fetching NASA FIRMS data:', error.message);
  }
}

module.exports = { fetchAndStoreFireHotspots };