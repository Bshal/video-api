const express = require('express')
const router = express.Router()
const shareController = require('../controllers/share.controller')

// Create share link route
router.post('/:videoId', shareController.createShareLink)

// Access shared video route
router.get('/:shareToken', shareController.accessSharedVideo)

module.exports = router
