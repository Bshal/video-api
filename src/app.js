require('dotenv').config()
const express = require('express')
const helmet = require('helmet')
const xss = require('xss-clean')
const cors = require('cors')

const auth = require('./middlewares/auth')
const routes = require('./routes')
const errorHandler = require('./middlewares/error')

// Initialize app
const app = express()

// Security Middlewares
app.use(helmet())
app.use(xss())
app.use(cors())

// Body Parser Middleware with JSON limit
app.use(express.json({ limit: '10kb' }))

// Apply authentication middleware to all routes below
app.use(auth)

// API Routes
app.use('/api', routes)

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
	next(createError.NotFound('Not Found'))
})

// handle error
app.use(errorHandler)

// Export the app module
module.exports = app
