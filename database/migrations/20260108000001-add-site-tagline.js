'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Verificar se já existe
    const exists = await queryInterface.rawSelect('settings', {
      where: { key: 'site_tagline' }
    }, ['id']);
    
    if (!exists) {
      await queryInterface.bulkInsert('settings', [{
        key: 'site_tagline',
        value: '',
        type: 'text',
        group: 'general',
        label: 'Slogan/Tagline',
        description: 'Texto que aparece ao lado do nome do site na aba do navegador',
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('settings', {
      key: 'site_tagline'
    });
  }
};
