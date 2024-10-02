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

exports.accessSharedVideo = catchAsync(async (req, res) => {})
