'use strict';
module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('transaction', {
    hash: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    data: {
      type: DataTypes.BLOB,
      allowNull: false,
    },
    comments: DataTypes.ARRAY(DataTypes.STRING),
    reacts: DataTypes.ARRAY(DataTypes.STRING),
  });
  Transaction.associate = models => {
    Transaction.belongsTo(models.account,{
      foreignKey: 'author',
    });
  }
  return Transaction;
};