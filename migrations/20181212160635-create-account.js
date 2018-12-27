'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('accounts', {
      address: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      balance: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      sequence: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      name: {
        type: Sequelize.STRING,
      },
      picture: {
        type: Sequelize.BLOB,
      },
      followings: {
        type: Sequelize.ARRAY(Sequelize.STRING),
      },
      followers: {
        type: Sequelize.ARRAY(Sequelize.STRING),
      },
      bandwidth: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      bandwidthTime: {
        type: Sequelize.DATE,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('accounts');
  }
};