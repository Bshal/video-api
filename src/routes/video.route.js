const express = require('express');
const router = express.Router();
const videoController = require('../controllers/video.controller');
const upload = require('../middlewares/upload');

/**
 * @swagger
 * tags:
 *   name: Videos
 *   description: Video management
 */

/**
 * @swagger
 * /videos/upload:
 *   post:
 *     summary: Upload a video file
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Video uploaded successfully
 *       400:
 *         description: Video duration out of bounds
 */
router.post('/upload', upload.single('video'), videoController.uploadVideo);

/**
 * @swagger
 * /videos/{id}/trim:
 *   post:
 *     summary: Trim a video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               startTime:
 *                 type: number
 *               endTime:
 *                 type: number
 *     responses:
 *       201:
 *         description: Video trimmed successfully
 *       400:
 *         description: Invalid startTime or endTime
 *       404:
 *         description: Video not found
 */
router.post('/:id/trim', videoController.trimVideo);

/**
 * @swagger
 * /videos/merge:
 *   post:
 *     summary: Merge multiple videos
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               videoIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Videos merged successfully
 *       400:
 *         description: videoIds must be a non-empty array
 *       404:
 *         description: One or more videos not found
 */
router.post('/merge', videoController.mergeVideos);

module.exports = router;