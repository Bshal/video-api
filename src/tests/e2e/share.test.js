const request = require('supertest')
const path = require('path')
const app = require('../../app') // Path to your Express app
const db = require('../../models') // Your database models

describe('Share Controller End-to-End Tests', () => {
	let server
	let uploadedVideoId
	let shareToken

	beforeAll(async () => {
		// Start the server
		server = app.listen(4001, () =>
			console.log('Test server running on port 4001')
		)

		// Sync the database
		await db.sequelize.sync({ force: true })

		// Upload a video to share
		const response = await request(app)
			.post('/api/videos/upload')
			.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
			.attach('video', path.join(__dirname, 'test_videos', 'dota.mp4'))

		uploadedVideoId = response.body.data.id
	})

	afterAll(async () => {
		// Close the server
		await server.close()

		// Close the database connection
		await db.sequelize.close()
	})

	describe('POST /api/share/:videoId', () => {
		it('should create a share link successfully', async () => {
			const response = await request(app)
				.post(`/api/share/${uploadedVideoId}`)
				.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
				.send({
					expiryTime: 10, // Expires in 10 minutes
				})

			expect(response.statusCode).toBe(201)
			expect(response.body).toHaveProperty('data')
			expect(response.body.data).toHaveProperty('link')
			expect(response.body.data).toHaveProperty('expiresAt')

			shareToken = response.body.data.link.split('/').pop()
		})

		it('should fail to create a share link with invalid expiry time', async () => {
			const response = await request(app)
				.post(`/api/share/${uploadedVideoId}`)
				.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
				.send({
					expiryTime: -5,
				})

			expect(response.statusCode).toBe(400)
			expect(response.body).toHaveProperty('message', 'Invalid expiry time')
		})

		it('should fail to create a share link for a non-existent video', async () => {
			const response = await request(app)
				.post('/api/share/9999')
				.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
				.send({
					expiryTime: 10,
				})

			expect(response.statusCode).toBe(404)
			expect(response.body).toHaveProperty('message', 'Video not found')
		})
	})

	describe('GET /api/share/:shareToken', () => {
		it('should access the shared video successfully', async () => {
			const response = await request(app)
				.get(`/api/share/${shareToken}`)
				.set('Authorization', `Bearer ${process.env.API_TOKEN}`)

			expect(response.statusCode).toBe(200)
			expect(response.headers['content-type']).toContain('video')
		})

		it('should fail to access with invalid share token', async () => {
			const response = await request(app)
				.get('/api/share/invalidtoken')
				.set('Authorization', `Bearer ${process.env.API_TOKEN}`)

			expect(response.statusCode).toBe(404)
			expect(response.body).toHaveProperty('message', 'Link not found')
		})

		it('should fail to access an expired link', async () => {
			// Create a link that expires in 1 minute
			const response = await request(app)
				.post(`/api/share/${uploadedVideoId}`)
				.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
				.send({
					expiryTime: 1, // Expires in 1 minute
				})

			expect(response.statusCode).toBe(201)
			expect(response.body).toHaveProperty('data')
			expect(response.body.data).toHaveProperty('link')

			const shareToken = response.body.data.link.split('/').pop()

			// Manually update the expiresAt field to a past date
			await db.SharedLink.update(
				{ expiresAt: new Date(Date.now() - 60000) }, // Set to 1 minute in the past
				{ where: { shareToken } }
			)

			const accessResponse = await request(app)
				.get(`/api/share/${shareToken}`)
				.set('Authorization', `Bearer ${process.env.API_TOKEN}`)

			expect(accessResponse.statusCode).toBe(410)
			expect(accessResponse.body).toHaveProperty('message', 'Link expired')
		})
	})
})
