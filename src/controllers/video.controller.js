const fs = require('fs')
const path = require('path')
const httpStatus = require('http-status')
const catchAsync = require('../utils/catchAsync')
const { getVideoDuration } = require('../utils/video')
const sendResponse = require('../utils/dataResponse')
const db = require('../models')

exports.uploadVideo = catchAsync(async (req, res) => {
	let video
	let newFilePath

	// Get video duration
	const duration = await getVideoDuration(req.file.path)

	const minDuration = parseInt(process.env.MIN_DURATION, 10) // in seconds
	const maxDuration = parseInt(process.env.MAX_DURATION, 10) // in seconds

	// Duration validation
	if (duration < minDuration || duration > maxDuration) {
		fs.unlinkSync(req.file.path)
		return res
			.status(httpStatus.BAD_REQUEST)
			.json(
				sendResponse(
					httpStatus.BAD_REQUEST,
					null,
					'Video duration out of bounds'
				)
			)
	}

	// Change the extension of the uploaded file to .mp4
	newFilePath = path.format({
		dir: path.dirname(req.file.path),
		name: path.basename(req.file.path, path.extname(req.file.path)),
		ext: '.mp4',
	})
	fs.renameSync(req.file.path, newFilePath)

	// Save video metadata to database
	video = await db.Video.create({
		fileName: path.basename(newFilePath),
		filePath: newFilePath,
		size: req.file.size,
		duration: duration,
	})

	res
		.status(httpStatus.CREATED)
		.json(
			sendResponse(httpStatus.CREATED, video, 'Video uploaded successfully!')
		)

	// Cleanup in case of error
	if (!video && newFilePath && fs.existsSync(newFilePath)) {
		fs.unlinkSync(newFilePath)
	}
})

exports.trimVideo = catchAsync(async (req, res) => {
	res.send('Video trimmed successfully')
})

exports.mergeVideos = catchAsync(async (req, res) => {
	res.send('Video merged successfully')
})
