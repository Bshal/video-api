const app = require('./app')
const db = require('./models')
const logger = require('./config/logger')

const PORT = process.env.PORT || 3000

let server

// Start the server after the database is synced
db.sequelize
	.sync()
	.then(() => {
		server = app.listen(PORT, () => {
			logger.info(`Server is running on port ${PORT}`)
		})
	})
	.catch((error) => {
		logger.error('Error in connecting to the database:', error)
	})

// Graceful shutdown
const exitHandler = () => {
	if (server) {
		server.close(() => {
			logger.info('Server closed')
			process.exit(1)
		})
	} else {
		process.exit(1)
	}
}

const unexpectedErrorHandler = (error) => {
	logger.error(error)
	exitHandler()
}

process.on('uncaughtException', unexpectedErrorHandler)
process.on('unhandledRejection', unexpectedErrorHandler)

process.on('SIGTERM', () => {
	logger.info('SIGTERM received')
	if (server) {
		server.close()
	}
})
