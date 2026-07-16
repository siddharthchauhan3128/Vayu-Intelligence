const redis = require('redis')

const client = redis.createClient({
  url: process.env.REDIS_URL
})

client.on('error', err => console.error('Redis error:', err))
client.on('connect', () => console.log('Connected to Redis'))

client.connect()

module.exports = client