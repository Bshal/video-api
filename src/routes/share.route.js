const express = require('express');
const router = express.Router();
const shareController = require('../controllers/share.controller');

/**
 * @swagger
 * tags:
 *   name: Share
 *   description: Video sharing
 */

/**
 * @swagger
 * /share/{videoId}:
 *   post:
 *     summary: Create a share link for a video
 *     tags: [Share]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         schema:
 *           type: string
 *         required: true
 *         description: Video ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expiryTime:
 *                 type: number
 *     responses:
 *       201:
 *         description: Share link created successfully
 *       400:
 *         description: Invalid expiry time
 *       404:
 *         description: Video not found
 */
router.post('/:videoId', shareController.createShareLink);

/**
 * @swagger
 * /share/{shareToken}:
 *   get:
 *     summary: Access a shared video
 *     tags: [Share]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shareToken
 *         schema:
 *           type: string
 *         required: true
 *         description: Share token
 *     responses:
 *       200:
 *         description: Video file
 *         content:
 *           video/mp4:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Link not found
 *       410:
 *         description: Link expired
 */

router.get('/:shareToken', shareController.accessSharedVideo);

module.exports = router;