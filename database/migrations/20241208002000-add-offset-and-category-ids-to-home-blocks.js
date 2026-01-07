'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('home_blocks');
    
    if (!tableInfo.category_ids) {
      await queryInterface.addColumn('home_blocks', 'category_ids', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }

    if (!tableInfo.offset) {
      await queryInterface.addColumn('home_blocks', 'offset', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('home_blocks');
    
    if (tableInfo.category_ids) {
      await queryInterface.removeColumn('home_blocks', 'category_ids');
    }
    if (tableInfo.offset) {
      await queryInterface.removeColumn('home_blocks', 'offset');
    }
  }
};
