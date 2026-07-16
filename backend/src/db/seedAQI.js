require('dotenv').config()
const pool = require('./pool')

const readings = [
  { ward_id:1, aqi:312, pm25:98,  pm10:145, no2:67 }, // Dharavi
  { ward_id:2, aqi:278, pm25:87,  pm10:132, no2:54 }, // Kurla
  { ward_id:3, aqi:241, pm25:74,  pm10:118, no2:48 }, // Andheri E
  { ward_id:4, aqi:334, pm25:112, pm10:167, no2:78 }, // Govandi
  { ward_id:5, aqi:295, pm25:93,  pm10:138, no2:61 }, // Chembur
  { ward_id:6, aqi:198, pm25:58,  pm10:98,  no2:39 }, // Bhandup
  { ward_id:7, aqi:145, pm25:42,  pm10:78,  no2:28 }, // Worli
  { ward_id:8, aqi:98,  pm25:28,  pm10:54,  no2:18 }, // Colaba
]

async function seed() {
  console.log('Seeding AQI readings...')
  for (const r of readings) {
    await pool.query(
      `INSERT INTO aqi_readings (time, station_id, ward_id, aqi, pm25, pm10, no2)
       VALUES (NOW(), $1, $2, $3, $4, $5, $6)`,
      [`station_${r.ward_id}`, r.ward_id, r.aqi, r.pm25, r.pm10, r.no2]
    )
  }
  console.log('Done — seeded', readings.length, 'AQI readings')
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })