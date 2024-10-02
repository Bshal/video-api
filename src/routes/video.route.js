const express = require('express')
const router = express.Router()
const videoController = require('../controllers/video.controller')
const upload = require('../middlewares/upload')

// Video upload route
router.post('/upload', upload.single('video'), videoController.uploadVideo)

// Video trimming route
router.post('/:id/trim', videoController.trimVideo)

// Video merging route
router.post('/merge', videoController.mergeVideos)

module.exports = router
