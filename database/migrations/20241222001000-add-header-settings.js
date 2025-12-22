'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Adicionar configurações de header
    const settings = [
      {
        key: 'header_style',
        value: 'default',
        type: 'select',
        group: 'layout',
        label: 'Estilo do Header',
        description: 'Escolha o layout do cabeçalho do site',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'logo_size',
        value: '40',
        type: 'select',
        group: 'layout',
        label: 'Tamanho da Logo',
        description: 'Altura máxima da logo em pixels',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    for (const setting of settings) {
      const exists = await queryInterface.rawSelect('settings', {
        where: { key: setting.key }
      }, ['id']);
      
      if (!exists) {
        await queryInterface.bulkInsert('settings', [setting]);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('settings', {
      key: ['header_style', 'logo_size']
    });
  }
};
