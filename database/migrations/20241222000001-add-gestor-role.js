'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Alterar o ENUM de role para incluir 'gestor'
    await queryInterface.sequelize.query(`
      ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'editor', 'gestor') NOT NULL DEFAULT 'editor'
    `);
  },

  async down(queryInterface, Sequelize) {
    // Reverter para o ENUM original
    await queryInterface.sequelize.query(`
      ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'editor') NOT NULL DEFAULT 'editor'
    `);
  }
};
