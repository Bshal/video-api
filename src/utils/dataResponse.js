const sendResponse = (status, data, message) => {
	const response = {
		statusCode: status,
		...(data && { data }),
		message,
	}

	return response
}

module.exports = sendResponse
