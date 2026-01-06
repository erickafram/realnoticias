'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const settings = [
      {
        key: 'code_head',
        value: '',
        type: 'textarea',
        group: 'code_injection',
        label: 'Código no <head>',
        description: 'Código HTML/JS para injetar antes do </head>',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'code_body_start',
        value: '',
        type: 'textarea',
        group: 'code_injection',
        label: 'Código após <body>',
        description: 'Código HTML/JS para injetar logo após a abertura do <body>',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'code_body_end',
        value: '',
        type: 'textarea',
        group: 'code_injection',
        label: 'Código antes de </body>',
        description: 'Código HTML/JS para injetar antes do fechamento do </body>',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'google_site_verification',
        value: '',
        type: 'text',
        group: 'seo',
        label: 'Google Site Verification',
        description: 'Código de verificação do Google Search Console',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'menu_font_size',
        value: '14',
        type: 'text',
        group: 'layout',
        label: 'Tamanho da Fonte do Menu',
        description: 'Tamanho em pixels da fonte do menu',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'home_hide_categories',
        value: '0',
        type: 'boolean',
        group: 'layout',
        label: 'Ocultar Categorias na Home',
        description: 'Ocultar widget de categorias na sidebar da home',
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
      key: {
        [Sequelize.Op.in]: [
          'code_head', 'code_body_start', 'code_body_end',
          'google_site_verification', 'menu_font_size', 'home_hide_categories'
        ]
      }
    });
  }
};
