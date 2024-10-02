module.exports = (sequelize, DataTypes) => {
	const SharedLink = sequelize.define('SharedLink', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		videoId: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		shareToken: {
			type: DataTypes.STRING,
			unique: true,
			allowNull: false,
		},
		expiresAt: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	})

	return SharedLink
}
