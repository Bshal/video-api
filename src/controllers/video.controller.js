const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const httpStatus = require('http-status')
const ffmpeg = require('fluent-ffmpeg')

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
	const videoId = req.params.id

	// Parse and validate startTime and endTime
	const startTime = parseFloat(req.body.startTime)
	const endTime = parseFloat(req.body.endTime)

	if (
		isNaN(startTime) ||
		isNaN(endTime) ||
		startTime < 0 ||
		endTime <= startTime
	) {
		return res
			.status(httpStatus.BAD_REQUEST)
			.json(
				sendResponse(
					httpStatus.BAD_REQUEST,
					null,
					'Invalid startTime or endTime'
				)
			)
	}

	const video = await db.Video.findByPk(videoId)
	if (!video) {
		return res
			.status(httpStatus.NOT_FOUND)
			.json(sendResponse(httpStatus.NOT_FOUND, null, 'Video not found'))
	}

	const inputPath = video.filePath

	// Ensure endTime does not exceed the video's duration
	const originalDuration = video.duration
	if (endTime > originalDuration) {
		return res
			.status(httpStatus.BAD_REQUEST)
			.json(
				sendResponse(
					httpStatus.BAD_REQUEST,
					null,
					'endTime exceeds video duration'
				)
			)
	}

	const outputFileName = `trimmed_${uuidv4()}.mp4`
	const outputPath = path.resolve('uploads', outputFileName)

	// Start trimming the video
	ffmpeg(inputPath)
		.setStartTime(startTime)
		.setDuration(endTime - startTime)
		.output(outputPath)
		.on('end', async () => {
			// Get the duration of the trimmed video
			const newDuration = await getVideoDuration(outputPath)

			// Save new video metadata
			const trimmedVideo = await db.Video.create({
				fileName: outputFileName,
				filePath: outputPath,
				size: fs.statSync(outputPath).size,
				duration: newDuration,
			})

			return res
				.status(httpStatus.CREATED)
				.json(
					sendResponse(
						httpStatus.CREATED,
						trimmedVideo,
						'Video trimmed successfully!'
					)
				)
		})
		.on('error', (err) => {
			if (fs.existsSync(outputPath)) {
				fs.unlinkSync(outputPath)
			}
			next(err)
		})
		.run()
})

exports.mergeVideos = catchAsync(async (req, res) => {
	res.send('Video merged successfully')
})
