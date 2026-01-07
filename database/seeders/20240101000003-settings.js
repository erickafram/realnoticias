'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const settings = [
      // Configurações Gerais
      {
        key: 'site_name',
        value: 'Portal Convictos',
        type: 'text',
        group: 'general',
        label: 'Nome do Site',
        description: 'Nome principal do site',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'site_description',
        value: 'Seu portal de notícias e entretenimento',
        type: 'textarea',
        group: 'general',
        label: 'Descrição do Site',
        description: 'Descrição curta para SEO',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'site_keywords',
        value: 'notícias, entretenimento, tecnologia, esportes, cultura',
        type: 'textarea',
        group: 'general',
        label: 'Palavras-chave',
        description: 'Palavras-chave para SEO (separadas por vírgula)',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'site_logo',
        value: '/images/logo.png',
        type: 'image',
        group: 'general',
        label: 'Logo do Site',
        description: 'Logo principal do site',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'site_favicon',
        value: '/images/favicon.ico',
        type: 'image',
        group: 'general',
        label: 'Favicon',
        description: 'Ícone do site',
        created_at: new Date(),
        updated_at: new Date()
      },
      // Configurações de Contato
      {
        key: 'contact_email',
        value: 'contato@portalconvictos.com',
        type: 'text',
        group: 'contact',
        label: 'Email de Contato',
        description: 'Email principal para contato',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'contact_phone',
        value: '(11) 99999-9999',
        type: 'text',
        group: 'contact',
        label: 'Telefone',
        description: 'Telefone de contato',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'contact_address',
        value: 'Rua Exemplo, 123 - São Paulo, SP',
        type: 'textarea',
        group: 'contact',
        label: 'Endereço',
        description: 'Endereço físico',
        created_at: new Date(),
        updated_at: new Date()
      },
      // Redes Sociais
      {
        key: 'social_facebook',
        value: 'https://facebook.com/portalconvictos',
        type: 'text',
        group: 'social',
        label: 'Facebook',
        description: 'URL do Facebook',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'social_instagram',
        value: 'https://instagram.com/portalconvictos',
        type: 'text',
        group: 'social',
        label: 'Instagram',
        description: 'URL do Instagram',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'social_twitter',
        value: 'https://twitter.com/portalconvictos',
        type: 'text',
        group: 'social',
        label: 'Twitter/X',
        description: 'URL do Twitter/X',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'social_youtube',
        value: 'https://youtube.com/portalconvictos',
        type: 'text',
        group: 'social',
        label: 'YouTube',
        description: 'URL do YouTube',
        created_at: new Date(),
        updated_at: new Date()
      },
      // Configurações de Posts
      {
        key: 'posts_per_page',
        value: '12',
        type: 'number',
        group: 'posts',
        label: 'Posts por Página',
        description: 'Quantidade de posts por página',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'featured_posts_count',
        value: '5',
        type: 'number',
        group: 'posts',
        label: 'Posts em Destaque',
        description: 'Quantidade de posts em destaque na home',
        created_at: new Date(),
        updated_at: new Date()
      },
      // Footer
      {
        key: 'footer_text',
        value: '© 2024 Portal Convictos. Todos os direitos reservados.',
        type: 'textarea',
        group: 'footer',
        label: 'Texto do Rodapé',
        description: 'Texto de copyright no rodapé',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Inserir apenas se não existir
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
    await queryInterface.bulkDelete('settings', null, {});
  }
};
