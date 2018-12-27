'use strict';
module.exports = (sequelize, DataTypes) => {
	const Account = sequelize.define('account', {
		address: {
			type: DataTypes.STRING,
			primaryKey: true
		},
		balance: DataTypes.BIGINT,
		sequence: DataTypes.BIGINT,
		name: DataTypes.BIGINT,
		picture: DataTypes.BLOB,
		followings: DataTypes.ARRAY(DataTypes.STRING),
		followers: DataTypes.ARRAY(DataTypes.STRING),
		balance: DataTypes.BIGINT,
		bandwidth: DataTypes.INTEGER,
		bandwidthTime: DataTypes.DATE
	});

	return Account;
};