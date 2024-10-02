const request = require('supertest')
const path = require('path')
const fs = require('fs')
const app = require('../../app') // Path to your Express app
const db = require('../../models') // Your database models

describe('Video Controller End-to-End Tests', () => {
	let server
	let uploadedVideoId
	let uploadedVideoId2

	beforeAll(async () => {
		// Start the server
		server = app.listen(4000, () =>
			console.log('Test server running on port 4000')
		)

		// Sync the database
		await db.sequelize.sync({ force: true })
	})

	afterAll(async () => {
		// Close the server
		await server.close()

		// Close the database connection
		await db.sequelize.close()
	})

	describe('POST /api/videos/upload', () => {
		it('should upload a video successfully', async () => {
			const response = await request(app)
				.post('/api/videos/upload')
				.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
				.attach('video', path.join(__dirname, 'test_videos', 'dota.mp4'))

			expect(response.statusCode).toBe(201)
			expect(response.body).toHaveProperty('data')
			expect(response.body.data).toHaveProperty('id')
			expect(response.body.data).toHaveProperty('fileName')
			expect(response.body.data).toHaveProperty('filePath')
			expect(response.body.data).toHaveProperty('size')
			expect(response.body.data).toHaveProperty('duration')

			uploadedVideoId = response.body.data.id
		})

		it('should fail to upload a video exceeding duration limits', async () => {
			const response = await request(app)
				.post('/api/videos/upload')
				.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
				.attach('video', path.join(__dirname, 'test_videos', 'long-video.mp4'))

			expect(response.statusCode).toBe(400)
			expect(response.body).toHaveProperty(
				'message',
				'Video duration out of bounds'
			)
		})
	})

	describe('POST /api/videos/:id/trim', () => {
		it('should trim a video successfully', async () => {
			const response = await request(app)
				.post(`/api/videos/${uploadedVideoId}/trim`)
				.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
				.send({
					startTime: 1,
					endTime: 5,
				})

			expect(response.statusCode).toBe(201)
			expect(response.body).toHaveProperty('data')
			expect(response.body.data).toHaveProperty('id')
			expect(response.body.data).toHaveProperty('fileName')
			expect(response.body.data).toHaveProperty('duration')

			// Check that duration is approximately 4 seconds
			expect(response.body.data.duration).toBeGreaterThanOrEqual(3.9)
			expect(response.body.data.duration).toBeLessThanOrEqual(5.1)
		})

		it('should fail to trim with invalid times', async () => {
			const response = await request(app)
				.post(`/api/videos/${uploadedVideoId}/trim`)
				.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
				.send({
					startTime: -1,
					endTime: 5,
				})

			expect(response.statusCode).toBe(400)
			expect(response.body).toHaveProperty(
				'message',
				'Invalid startTime or endTime'
			)
		})

		it('should fail to trim a non-existent video', async () => {
			const response = await request(app)
				.post('/api/videos/9999/trim')
				.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
				.send({
					startTime: 1,
					endTime: 5,
				})

			expect(response.statusCode).toBe(404)
			expect(response.body).toHaveProperty('message', 'Video not found')
		})
	})

	describe('POST /api/videos/merge', () => {
		beforeAll(async () => {
			// Upload a second video for merging
			const response = await request(app)
				.post('/api/videos/upload')
				.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
				.attach('video', path.join(__dirname, 'test_videos', 'valorant.mp4'))

			uploadedVideoId2 = response.body.data.id
		})

		it('should merge two videos successfully', async () => {
			const response = await request(app)
				.post('/api/videos/merge')
				.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
				.send({
					videoIds: [uploadedVideoId, uploadedVideoId2],
				})

			expect(response.statusCode).toBe(201)
			expect(response.body).toHaveProperty('data')
			expect(response.body.data).toHaveProperty('id')
			expect(response.body.data).toHaveProperty('fileName')
			expect(response.body.data).toHaveProperty('duration')
		})

		it('should fail to merge with invalid video IDs', async () => {
			const response = await request(app)
				.post('/api/videos/merge')
				.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
				.send({
					videoIds: [uploadedVideoId, 9999],
				})

			expect(response.statusCode).toBe(404)
			expect(response.body).toHaveProperty(
				'message',
				'One or more videos not found'
			)
		})
	})
})
