const path = require('path')
const { v4: uuidv4 } = require('uuid')
const httpStatus = require('http-status')

const db = require('../models')
const catchAsync = require('../utils/catchAsync')
const sendResponse = require('../utils/dataResponse')

exports.createShareLink = catchAsync(async (req, res) => {
	const { expiryTime } = req.body

	const videoId = parseInt(req.params.videoId, 10)
	if (isNaN(videoId)) {
		return res
			.status(httpStatus.BAD_REQUEST)
			.json(
				sendResponse(httpStatus.BAD_REQUEST, null, 'Invalid video ID format')
			)
	}

	if (!expiryTime || typeof expiryTime !== 'number' || expiryTime <= 0) {
		return res
			.status(httpStatus.BAD_REQUEST)
			.json(sendResponse(httpStatus.BAD_REQUEST, null, 'Invalid expiry time'))
	}

	const video = await db.Video.findByPk(videoId)
	if (!video) {
		return res
			.status(httpStatus.NOT_FOUND)
			.json(sendResponse(httpStatus.NOT_FOUND, null, 'Video not found'))
	}

	const shareToken = uuidv4()
	const expiresAt = new Date(Date.now() + expiryTime * 60000)

	await db.SharedLink.create({
		videoId,
		shareToken,
		expiresAt,
	})

	res.status(httpStatus.CREATED).json(
		sendResponse(
			httpStatus.NOT_FOUND,
			{
				link: `${req.protocol}://${req.get('host')}/share/${shareToken}`,
				expiresAt,
			},
			'Share link created successfully!'
		)
	)
})

exports.accessSharedVideo = catchAsync(async (req, res) => {
	const { shareToken } = req.params

	if (!shareToken || shareToken.trim() === '' || shareToken === ':shareToken') {
		return res
			.status(httpStatus.BAD_REQUEST)
			.json(
				sendResponse(httpStatus.BAD_REQUEST, null, 'Share token is required')
			)
	}

	const sharedLink = await db.SharedLink.findOne({ where: { shareToken } })
	if (!sharedLink) {
		return res
			.status(httpStatus.NOT_FOUND)
			.json(sendResponse(httpStatus.NOT_FOUND, null, 'Link not found'))
	}

	if (new Date() > sharedLink.expiresAt) {
		return res
			.status(httpStatus.GONE)
			.json(sendResponse(httpStatus.GONE, null, 'Link expired'))
	}

	const video = await db.Video.findByPk(sharedLink.videoId)
	if (!video) {
		return res
			.status(httpStatus.NOT_FOUND)
			.json(sendResponse(httpStatus.NOT_FOUND, null, 'Video not found'))
	}

	if (!video.filePath) {
		return res
			.status(httpStatus.INTERNAL_SERVER_ERROR)
			.json(
				sendResponse(
					httpStatus.INTERNAL_SERVER_ERROR,
					null,
					'Video file path is missing'
				)
			)
	}

	// Set content type and headers for the video response
	res.setHeader('Content-Type', 'video/mp4')
	res.setHeader('Content-Disposition', `inline; filename="${video.title}.mp4"`)

	res.sendFile(path.resolve(video.filePath), (err) => {
		if (err) {
			next(err)
		}
	})
})
