require('dotenv').config()
const pool = require('./pool.js')

const readings = [
  // Mumbai
  { ward:'Dharavi',    city:'mumbai', aqi:312, pm25:98,  pm10:145 },
  { ward:'Kurla',      city:'mumbai', aqi:278, pm25:87,  pm10:132 },
  { ward:'Andheri E',  city:'mumbai', aqi:241, pm25:74,  pm10:118 },
  { ward:'Govandi',    city:'mumbai', aqi:334, pm25:112, pm10:167 },
  { ward:'Chembur',    city:'mumbai', aqi:295, pm25:93,  pm10:138 },
  { ward:'Bhandup',    city:'mumbai', aqi:198, pm25:58,  pm10:98  },
  { ward:'Worli',      city:'mumbai', aqi:145, pm25:42,  pm10:78  },
  { ward:'Colaba',     city:'mumbai', aqi:98,  pm25:28,  pm10:54  },
  // Delhi
  { ward:'Anand Vihar',city:'delhi',  aqi:389, pm25:121, pm10:178 },
  { ward:'Rohini',     city:'delhi',  aqi:298, pm25:93,  pm10:141 },
  { ward:'Okhla',      city:'delhi',  aqi:334, pm25:104, pm10:156 },
  { ward:'Dwarka',     city:'delhi',  aqi:267, pm25:83,  pm10:125 },
]

async function seed() {
  console.log('Seeding AQI readings...')
  for (const r of readings) {
    const wardRes = await pool.query(
      `SELECT id FROM wards WHERE ward_name = $1 AND city = $2`,
      [r.ward, r.city]
    )
    const ward_id = wardRes.rows[0]?.id
    if (!ward_id) { console.log(`Ward not found: ${r.ward}`); continue }

    await pool.query(
      `INSERT INTO aqi_readings (time, station_id, ward_id, aqi, pm25, pm10)
       VALUES (NOW(), $1, $2, $3, $4, $5)`,
      [`station_${r.ward}`, ward_id, r.aqi, r.pm25, r.pm10]
    )
    console.log(`Seeded ${r.ward} (${r.city}): AQI=${r.aqi}`)
  }
  console.log('Done')
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })