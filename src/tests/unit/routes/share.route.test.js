// tests/routes/share.route.test.js
const request = require('supertest')
const express = require('express')
const shareRoutes = require('../../../routes/share.route')

jest.mock('../../../controllers/share.controller')

const app = express()
app.use(express.json())
app.use('/share', shareRoutes)

const shareController = require('../../../controllers/share.controller')

describe('Share Routes Unit Tests', () => {
	beforeEach(() => {
		jest.resetAllMocks()
	})

	describe('POST /share/:videoId', () => {
		it('should route to createShareLink controller', async () => {
			shareController.createShareLink.mockImplementation((req, res) =>
				res.sendStatus(201)
			)

			const response = await request(app).post('/share/1').send()

			expect(shareController.createShareLink).toHaveBeenCalled()
			expect(response.statusCode).toBe(201)
		})
	})

	describe('GET /share/:shareToken', () => {
		it('should route to accessSharedVideo controller', async () => {
			shareController.accessSharedVideo.mockImplementation((req, res) =>
				res.sendStatus(200)
			)

			const response = await request(app).get('/share/test-token').send()

			expect(shareController.accessSharedVideo).toHaveBeenCalled()
			expect(response.statusCode).toBe(200)
		})
	})
})
