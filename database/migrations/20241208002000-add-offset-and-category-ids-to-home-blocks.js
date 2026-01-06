'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('home_blocks', 'category_ids', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('home_blocks', 'offset', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('home_blocks', 'category_ids');
    await queryInterface.removeColumn('home_blocks', 'offset');
  }
};
