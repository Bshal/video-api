require('module-alias/register')
require('dotenv').config()
const express = require('express')
const helmet = require('helmet')
const xss = require('xss-clean')
const cors = require('cors')
const createError = require('http-errors')

const auth = require('./middlewares/auth')
const routes = require('./routes')
const errorHandler = require('./middlewares/error')
const { swaggerUi, specs } = require('./config/swagger');

// Initialize app
const app = express()

// Security Middlewares
app.use(helmet())
app.use(xss())
app.use(cors())

// Body Parser Middleware with JSON limit
app.use(express.json({ limit: '10kb' }))

// Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
	swaggerOptions: {
		authAction: {
			bearerAuth: {
				name: "bearerAuth",
				schema: {
					type: "http",
					in: "header",
					name: "Authorization",
					description: "",
				},
				value: process.env.API_TOKEN
			}
		}
	}
}));

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
