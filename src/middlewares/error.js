const httpStatus = require('http-status')

const errorHandler = (err, req, res, next) => {
	let { statusCode, message } = err

	console.log('from error.js')
	console.log(statusCode, message)

	const response = {
		code: statusCode || httpStatus.INTERNAL_SERVER_ERROR,
		message,
		...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
	}

	res.status(response?.code || httpStatus.INTERNAL_SERVER_ERROR).send(response)
}

module.exports = errorHandler
