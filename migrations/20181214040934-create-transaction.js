'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('transactions', {
      hash: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      author: {
        allowNull: false,
        type: Sequelize.STRING,
        references: {
          model: 'accounts',
          key: 'address',
        },
        onUpdate: 'CASCADE',
      },
      type: {
        allowNull: false,
        type: Sequelize.STRING
      },
      data: {
        allowNull: false,
        type: Sequelize.BLOB
      },
      comments: {
        type: Sequelize.ARRAY(Sequelize.STRING),
      },
      reacts: {
        type: Sequelize.ARRAY(Sequelize.STRING),
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
    return queryInterface.dropTable('Transactions');
  }
};