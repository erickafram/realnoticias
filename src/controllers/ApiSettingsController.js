/**
 * Controller de Configurações de API
 * Gerenciamento das configurações de API (apenas admin)
 */
const { Setting } = require('../models');
const { clearSettingsCache } = require('../middlewares/settings');

class ApiSettingsController {
  // Exibir página de configurações de API
  async index(req, res) {
    try {
      const settings = await Setting.findAll({
        where: { group: 'ai' },
        order: [['key', 'ASC']]
      });

      // Converter para objeto
      const aiSettings = {};
      settings.forEach(setting => {
        aiSettings[setting.key] = setting.value;
      });

      res.render('admin/api/index', {
        title: 'Configurações de API',
        aiSettings
      });
    } catch (error) {
      console.error('Erro ao carregar configurações de API:', error);
      req.flash('error', 'Erro ao carregar configurações de API.');
      res.redirect('/admin');
    }
  }

  // Salvar configurações de API
  async update(req, res) {
    try {
      const { ai_api_key, ai_api_url, ai_enabled, ai_model } = req.body;

      const apiSettings = [
        { key: 'ai_api_key', value: ai_api_key || '' },
        { key: 'ai_api_url', value: ai_api_url || 'https://api.together.xyz/v1/chat/completions' },
        { key: 'ai_enabled', value: ai_enabled || 'false' },
        { key: 'ai_model', value: ai_model || 'meta-llama/Llama-3-70b-chat-hf' }
      ];

      for (const setting of apiSettings) {
        const existing = await Setting.findOne({ where: { key: setting.key } });
        
        if (existing) {
          await Setting.update(
            { value: setting.value },
            { where: { key: setting.key } }
          );
        } else {
          await Setting.create({
            key: setting.key,
            value: setting.value,
            type: 'text',
            group: 'ai',
            label: setting.key
          });
        }
      }

      // Limpar cache de configurações
      clearSettingsCache();

      req.flash('success', 'Configurações de API salvas com sucesso!');
      res.redirect('/admin/api');
    } catch (error) {
      console.error('Erro ao salvar configurações de API:', error);
      req.flash('error', 'Erro ao salvar configurações de API: ' + error.message);
      res.redirect('/admin/api');
    }
  }
}

module.exports = new ApiSettingsController();
