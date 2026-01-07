'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    const users = [
      {
        name: 'Administrador',
        email: 'admin@portal.com',
        password_hash: passwordHash,
        role: 'admin',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Editor',
        email: 'editor@portal.com',
        password_hash: passwordHash,
        role: 'editor',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Inserir apenas se não existir
    for (const user of users) {
      const exists = await queryInterface.rawSelect('users', {
        where: { email: user.email }
      }, ['id']);
      
      if (!exists) {
        await queryInterface.bulkInsert('users', [user]);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};
