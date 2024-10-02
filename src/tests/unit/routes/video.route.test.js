// tests/routes/video.route.test.js
const request = require('supertest')
const express = require('express')
const videoRoutes = require('src/routes/video.route')

jest.mock('src/controllers/video.controller')

const app = express()
app.use(express.json())
app.use('/videos', videoRoutes)

const videoController = require('src/controllers/video.controller')

describe('Video Routes Unit Tests', () => {
	beforeEach(() => {
		jest.resetAllMocks()
	})

	describe('POST /videos/upload', () => {
		it('should route to uploadVideo controller', async () => {
			videoController.uploadVideo.mockImplementation((req, res) =>
				res.sendStatus(201)
			)

			const response = await request(app).post('/videos/upload').send()

			expect(videoController.uploadVideo).toHaveBeenCalled()
			expect(response.statusCode).toBe(201)
		})
	})

	describe('POST /videos/:id/trim', () => {
		it('should route to trimVideo controller', async () => {
			videoController.trimVideo.mockImplementation((req, res) =>
				res.sendStatus(201)
			)

			const response = await request(app).post('/videos/1/trim').send()

			expect(videoController.trimVideo).toHaveBeenCalled()
			expect(response.statusCode).toBe(201)
		})
	})

	describe('POST /videos/merge', () => {
		it('should route to mergeVideos controller', async () => {
			videoController.mergeVideos.mockImplementation((req, res) =>
				res.sendStatus(201)
			)

			const response = await request(app).post('/videos/merge').send()

			expect(videoController.mergeVideos).toHaveBeenCalled()
			expect(response.statusCode).toBe(201)
		})
	})
})