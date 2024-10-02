const multer = require('multer')
const bytes = require('bytes')

const upload = multer({
	dest: 'uploads/',
	limits: { fileSize: bytes.parse(process.env.MAX_FILE_SIZE) },
})

module.exports = upload
