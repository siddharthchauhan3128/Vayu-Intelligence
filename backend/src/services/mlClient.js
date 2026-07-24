const axios = require('axios')

const ML_URL = process.env.ML_SERVICE_URL || 'http://ml-service:8000'

async function getForecast(wardName, currentAqi, hours = 72) {
  try {
    const res = await axios.post(`${ML_URL}/ml/forecast`, {
      ward_name: wardName,
      current_aqi: currentAqi,
      hours
    }, { timeout: 30000 })
    return res.data
  } catch (err) {
    console.error('[ML Client] Forecast error:', err.message)
    throw err
  }
}

async function getAttribution(wardName, landUse, aqi) {
  try {
    const res = await axios.post(`${ML_URL}/ml/attribute`, {
      ward_name: wardName,
      land_use: landUse,
      aqi
    }, { timeout: 30000 })
    return res.data
  } catch (err) {
    console.error('[ML Client] Attribution error:', err.message)
    throw err
  }
}

module.exports = { getForecast, getAttribution }