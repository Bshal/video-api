const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const httpStatus = require('http-status')
const ffmpeg = require('fluent-ffmpeg')

const catchAsync = require('../utils/catchAsync')
const { getVideoDuration } = require('../utils/video')
const sendResponse = require('../utils/dataResponse')
const db = require('../models')

/**
 * Uploads a video, validates its duration, renames it to .mp4, and saves metadata to the database.
 * Responds with the video metadata if successful, or an error message if the duration is out of bounds.
 */
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

/**
 * Trims a video based on provided startTime and endTime, and saves the trimmed video metadata to the database.
 * Responds with the trimmed video metadata if successful, or an error message if the input is invalid.
 */
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

/**
 * Merges multiple videos into one, ensuring all videos exist and are valid.
 * Responds with the merged video metadata if successful, or an error message if any input is invalid.
 */
exports.mergeVideos = catchAsync(async (req, res, next) => {
	const { videoIds } = req.body

	// Input validation
	if (!Array.isArray(videoIds) || videoIds.length === 0) {
		return res
			.status(httpStatus.BAD_REQUEST)
			.json(
				sendResponse(
					httpStatus.BAD_REQUEST,
					null,
					'videoIds must be a non-empty array'
				)
			)
	}

	// Convert IDs to integers and validate
	const videoIdsInt = videoIds.map((id) => parseInt(id, 10))
	if (videoIdsInt.some(isNaN)) {
		return res
			.status(httpStatus.BAD_REQUEST)
			.json(
				sendResponse(
					httpStatus.BAD_REQUEST,
					null,
					'All videoIds must be valid integers'
				)
			)
	}

	// Fetch videos from the database
	const videos = await db.Video.findAll({
		where: { id: videoIdsInt },
	})

	if (videos.length !== videoIdsInt.length) {
		return res
			.status(httpStatus.NOT_FOUND)
			.json(
				sendResponse(httpStatus.NOT_FOUND, null, 'One or more videos not found')
			)
	}

	// Verify that video files exist on disk
	for (const video of videos) {
		await fs.promises.access(video.filePath).catch(() => {
			return res
				.status(httpStatus.NOT_FOUND)
				.json(
					sendResponse(
						httpStatus.NOT_FOUND,
						null,
						`Video file not found: ${video.fileName}`
					)
				)
		})
	}

	// Generate unique output filename
	const uuid = uuidv4()
	const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads')
	const outputPath = path.join(uploadsDir, `merged_${uuid}.mp4`)

	// Prepare FFmpeg command using the concat filter
	let ffmpegCommand = ffmpeg()

	// Add each video as an input
	videos.forEach((video) => {
		ffmpegCommand = ffmpegCommand.input(video.filePath)
	})

	// Build the complex filter for concatenation and scaling
	let filterComplex = ''
	for (let i = 0; i < videos.length; i++) {
		filterComplex += `[${i}:v:0]scale=iw*min(1280/iw\\,720/ih):ih*min(1280/iw\\,720/ih),pad=1280:720:(1280-iw*min(1280/iw\\,720/ih))/2:(720-ih*min(1280/iw\\,720/ih))/2,setsar=1[v${i}];[${i}:a:0]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[a${i}];`
	}
	filterComplex +=
		videos.map((_, i) => `[v${i}][a${i}]`).join('') +
		`concat=n=${videos.length}:v=1:a=1[outv][outa]`

	ffmpegCommand
		.complexFilter([filterComplex])
		.outputOptions([
			'-map',
			'[outv]',
			'-map',
			'[outa]',
			'-c:v',
			'libx264', // Video codec
			'-c:a',
			'aac', // Audio codec
			'-b:a',
			'128k', // Audio bitrate
			'-ac',
			'2', // Audio channels
			'-ar',
			'44100', // Audio sample rate
			'-r',
			'30', // Frame rate
			'-pix_fmt',
			'yuv420p', // Pixel format
		])
		.on('error', next)
		.on('end', async () => {
			const newDuration = await getVideoDuration(outputPath)
			const { size } = await fs.promises.stat(outputPath)

			const mergedVideo = await db.Video.create({
				fileName: path.basename(outputPath),
				filePath: outputPath,
				size: size,
				duration: newDuration,
			})

			return res
				.status(httpStatus.CREATED)
				.json(
					sendResponse(
						httpStatus.CREATED,
						mergedVideo,
						'Videos merged successfully!'
					)
				)
		})
		.save(outputPath)
})
