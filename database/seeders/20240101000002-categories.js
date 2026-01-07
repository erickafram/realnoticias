'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('categories', [
      {
        name: 'Notícias',
        slug: 'noticias',
        description: 'Últimas notícias e acontecimentos',
        color: '#3ba4ff',
        icon: 'bi-newspaper',
        order: 1,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Entretenimento',
        slug: 'entretenimento',
        description: 'Novidades do mundo do entretenimento',
        color: '#ff6b6b',
        icon: 'bi-film',
        order: 2,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Tecnologia',
        slug: 'tecnologia',
        description: 'Inovações e tendências tecnológicas',
        color: '#4ecdc4',
        icon: 'bi-cpu',
        order: 3,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Esportes',
        slug: 'esportes',
        description: 'Cobertura esportiva completa',
        color: '#45b7d1',
        icon: 'bi-trophy',
        order: 4,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Cultura',
        slug: 'cultura',
        description: 'Arte, música e cultura em geral',
        color: '#96ceb4',
        icon: 'bi-palette',
        order: 5,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('categories', null, {});
  }
};
