const axios = require('axios')
const redis = require('./redisClient.js')

const CITIES = [
  { name:'mumbai',    lat:19.07, lon:72.87 },
  { name:'delhi',     lat:28.61, lon:77.20 },
  { name:'bengaluru', lat:12.97, lon:77.59 },
  { name:'kolkata',   lat:22.57, lon:88.36 },
]

async function fetchWeather() {
  console.log('[WEATHER] Fetching meteorological data...')
  try {
    for (const city of CITIES) {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather`,
        {
          params: {
            lat: city.lat,
            lon: city.lon,
            appid: process.env.OPENWEATHER_KEY,
            units: 'metric'
          },
          timeout: 5000
        }
      )
      const d = res.data
      const weather = {
        temp:      d.main.temp,
        humidity:  d.main.humidity,
        wind_speed: d.wind.speed,
        wind_deg:  d.wind.deg,
        description: d.weather[0].description,
        time: new Date()
      }
      await redis.set(
        `weather:${city.name}`,
        JSON.stringify(weather),
        { EX: 1800 } // 30 min cache
      )
      console.log(`[WEATHER] ${city.name}: ${weather.temp}°C wind ${weather.wind_speed}m/s`)
    }
  } catch (err) {
    console.error('[WEATHER] Error:', err.message)
  }
}

module.exports = { fetchWeather }