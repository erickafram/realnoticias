'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const settings = [
      { key: 'code_head', value: '', type: 'textarea', group: 'code_injection', label: 'Codigo no head', description: 'Codigo HTML/JS para injetar no head', created_at: new Date(), updated_at: new Date() },
      { key: 'code_body_start', value: '', type: 'textarea', group: 'code_injection', label: 'Codigo apos body', description: 'Codigo HTML/JS apos abertura do body', created_at: new Date(), updated_at: new Date() },
      { key: 'code_body_end', value: '', type: 'textarea', group: 'code_injection', label: 'Codigo antes de fechar body', description: 'Codigo HTML/JS antes de fechar body', created_at: new Date(), updated_at: new Date() },
      { key: 'google_site_verification', value: '', type: 'text', group: 'seo', label: 'Google Site Verification', description: 'Codigo de verificacao do Google Search Console', created_at: new Date(), updated_at: new Date() },
      { key: 'menu_font_size', value: '14', type: 'text', group: 'layout', label: 'Tamanho da Fonte do Menu', description: 'Tamanho em pixels da fonte do menu', created_at: new Date(), updated_at: new Date() },
      { key: 'home_hide_categories', value: '0', type: 'boolean', group: 'layout', label: 'Ocultar Categorias na Home', description: 'Ocultar widget de categorias na sidebar', created_at: new Date(), updated_at: new Date() },
      { key: 'ads_home_top', value: '', type: 'textarea', group: 'ads', label: 'Anuncio Topo Home', description: 'Codigo do anuncio para o topo da home', created_at: new Date(), updated_at: new Date() },
      { key: 'ads_home_middle', value: '', type: 'textarea', group: 'ads', label: 'Anuncio Meio Home', description: 'Codigo do anuncio para o meio da home', created_at: new Date(), updated_at: new Date() },
      { key: 'ads_home_bottom', value: '', type: 'textarea', group: 'ads', label: 'Anuncio Rodape Home', description: 'Codigo do anuncio para o rodape da home', created_at: new Date(), updated_at: new Date() },
      { key: 'ads_home_sidebar', value: '', type: 'textarea', group: 'ads', label: 'Anuncio Sidebar Home', description: 'Codigo do anuncio para a sidebar da home', created_at: new Date(), updated_at: new Date() },
      { key: 'ads_post_top', value: '', type: 'textarea', group: 'ads', label: 'Anuncio Topo Post', description: 'Codigo do anuncio para o topo das postagens', created_at: new Date(), updated_at: new Date() },
      { key: 'ads_post_middle', value: '', type: 'textarea', group: 'ads', label: 'Anuncio Meio Post', description: 'Codigo do anuncio para o meio das postagens', created_at: new Date(), updated_at: new Date() },
      { key: 'ads_post_bottom', value: '', type: 'textarea', group: 'ads', label: 'Anuncio Rodape Post', description: 'Codigo do anuncio apos o conteudo das postagens', created_at: new Date(), updated_at: new Date() },
      { key: 'ads_post_sidebar', value: '', type: 'textarea', group: 'ads', label: 'Anuncio Sidebar Post', description: 'Codigo do anuncio para a sidebar das postagens', created_at: new Date(), updated_at: new Date() }
    ];

    for (const setting of settings) {
      const exists = await queryInterface.rawSelect('settings', { where: { key: setting.key } }, ['id']);
      if (!exists) {
        await queryInterface.bulkInsert('settings', [setting]);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const keys = ['code_head', 'code_body_start', 'code_body_end', 'google_site_verification', 'menu_font_size', 'home_hide_categories', 'ads_home_top', 'ads_home_middle', 'ads_home_bottom', 'ads_home_sidebar', 'ads_post_top', 'ads_post_middle', 'ads_post_bottom', 'ads_post_sidebar'];
    await queryInterface.bulkDelete('settings', { key: keys });
  }
};
