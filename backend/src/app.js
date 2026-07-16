require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { createServer } = require('http')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/wards', require('./routes/wards.routes.js'))
// Routes — add as you build them
// app.use('/api/wards',    require('./routes/wards'))
// app.use('/api/forecast', require('./routes/forecast'))
// app.use('/api/agent',    require('./routes/agents'))

const server = createServer(app)
server.listen(process.env.NODE_PORT || 3001, () =>
  console.log(`Vayu backend on :${process.env.NODE_PORT || 3001}`)
)