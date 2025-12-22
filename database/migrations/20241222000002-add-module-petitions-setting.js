'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Verificar se a configuração já existe
    const [results] = await queryInterface.sequelize.query(
      `SELECT * FROM settings WHERE \`key\` = 'module_petitions'`
    );

    if (results.length === 0) {
      await queryInterface.bulkInsert('settings', [{
        key: 'module_petitions',
        value: 'true',
        type: 'boolean',
        group: 'modules',
        label: 'Módulo de Petições',
        description: 'Ativa ou desativa o módulo de petições',
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('settings', {
      key: 'module_petitions'
    });
  }
};
