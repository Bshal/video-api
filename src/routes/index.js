const express = require('express')
const router = express.Router()
const videoRoutes = require('./video.route')
const shareRoutes = require('./share.route')

// Redirect to specific routers
router.use('/videos', videoRoutes)
router.use('/share', shareRoutes)

module.exports = router
