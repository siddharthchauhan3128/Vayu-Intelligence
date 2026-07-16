require('dotenv').config()
const pool = require('./pool.js')

const wards = [
  { city:'mumbai', name:'Dharavi',    pop:850000,  land:'residential' },
  { city:'mumbai', name:'Kurla',      pop:650000,  land:'mixed' },
  { city:'mumbai', name:'Andheri E',  pop:720000,  land:'commercial' },
  { city:'mumbai', name:'Govandi',    pop:410000,  land:'industrial' },
  { city:'mumbai', name:'Chembur',    pop:390000,  land:'industrial' },
  { city:'mumbai', name:'Bhandup',    pop:310000,  land:'residential' },
  { city:'mumbai', name:'Worli',      pop:180000,  land:'commercial' },
  { city:'mumbai', name:'Colaba',     pop:120000,  land:'commercial' },
  { city:'delhi',  name:'Anand Vihar',pop:520000,  land:'industrial' },
  { city:'delhi',  name:'Rohini',     pop:890000,  land:'residential' },
  { city:'delhi',  name:'Okhla',      pop:430000,  land:'industrial' },
  { city:'delhi',  name:'Dwarka',     pop:760000,  land:'residential' },
]

async function seed() {
  console.log('Seeding wards...')
  for (const w of wards) {
    await pool.query(
      `INSERT INTO wards (city, ward_name, population, land_use_type)
       VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      [w.city, w.name, w.pop, w.land]
    )
  }
  console.log('Done — seeded', wards.length, 'wards')
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })