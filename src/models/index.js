const { Sequelize } = require('sequelize')

const sequelize = new Sequelize({
	dialect: 'sqlite',
	storage: 'database.sqlite',
	logging: false,
})

const db = {}

db.Sequelize = Sequelize
db.sequelize = sequelize

db.Video = require('./video')(sequelize, Sequelize)
db.SharedLink = require('./sharedLink')(sequelize, Sequelize)

module.exports = db
