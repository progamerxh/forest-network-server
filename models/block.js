'use strict';
module.exports = (sequelize, DataTypes) => {
    const Block = sequelize.define(
        'block',
        {
            height:{
				type: DataTypes.BIGINT,
				primaryKey: true
			},
            time: DataTypes.DATE,
            hash: DataTypes.STRING,
            appHash: DataTypes.STRING,
        },
        {}
    );
    return Block;
};