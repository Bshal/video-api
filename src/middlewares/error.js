const httpStatus = require('http-status')

const errorHandler = (err, req, res, next) => {
	let { statusCode, message } = err

	// Handle Multer file size limit error
	if (err.code === 'LIMIT_FILE_SIZE') {
		statusCode = httpStatus.BAD_REQUEST
		message = 'File size exceeds limit'
	}

	const response = {
		statusCode: statusCode || httpStatus.INTERNAL_SERVER_ERROR,
		message,
	}

	res
		.status(response?.statusCode || httpStatus.INTERNAL_SERVER_ERROR)
		.send(response)
}

module.exports = errorHandler
