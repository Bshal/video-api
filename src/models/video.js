module.exports = (sequelize, DataTypes) => {
	const Video = sequelize.define('Video', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		fileName: DataTypes.STRING,
		filePath: DataTypes.STRING,
		size: DataTypes.INTEGER,
		duration: DataTypes.FLOAT,
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	})

	return Video
}
