require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seedFire() {
  try {
    console.log('Creating fire_hotspots table...');
    // Ensure the table exists so our frontend route doesn't fail
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fire_hotspots (
        id SERIAL PRIMARY KEY,
        latitude DECIMAL(9,6),
        longitude DECIMAL(9,6),
        brightness DECIMAL(6,2),
        frp DECIMAL(8,2),
        confidence VARCHAR(10),
        acq_time VARCHAR(4),
        ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Inserting mock fire near Dharavi...');
    // We use parameterized queries ($1) to completely avoid quote syntax errors!
    // Coords placed exactly next to Dharavi (19.0422, 72.8530)
    await pool.query(
      `INSERT INTO fire_hotspots (latitude, longitude, brightness, confidence, frp, acq_time) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [19.0450, 72.8550, 350.5, 'h', 45.2, '1430']
    );

    console.log('✅ Mock fire inserted successfully!');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    pool.end();
  }
}

seedFire();