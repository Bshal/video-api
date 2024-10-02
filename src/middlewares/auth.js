module.exports = (req, res, next) => {
	const authHeader = req.headers['authorization']

	if (!authHeader) {
		return res.status(401).json({ error: 'No token provided' })
	}

	const token = authHeader.split(' ')[1]

	if (token !== process.env.API_TOKEN) {
		return res.status(403).json({ error: 'Invalid token' })
	}

	next()
}
