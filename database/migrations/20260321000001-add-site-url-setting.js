'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Verificar se a configuração já existe
    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM settings WHERE \`key\` = 'site_url'`
    );

    if (existing.length === 0) {
      await queryInterface.bulkInsert('settings', [{
        key: 'site_url',
        value: '',
        type: 'text',
        group: 'general',
        label: 'URL do Site',
        description: 'URL pública do site (ex: https://www.portalconvictos.com.br). Usada nos botões de compartilhar, meta tags e sitemaps.',
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('settings', { key: 'site_url' });
  }
};
