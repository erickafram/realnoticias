/**
 * Controller de Módulos
 * Gerenciamento dos módulos do sistema (apenas admin)
 */
const { Setting } = require('../models');
const { clearSettingsCache } = require('../middlewares/settings');

class ModulesController {
  // Exibir página de módulos
  async index(req, res) {
    try {
      const settings = await Setting.findAll({
        where: { group: 'modules' },
        order: [['key', 'ASC']]
      });

      // Converter para objeto
      const modules = {};
      settings.forEach(setting => {
        modules[setting.key] = setting.value === 'true';
      });

      res.render('admin/modules/index', {
        title: 'Módulos',
        modules
      });
    } catch (error) {
      console.error('Erro ao carregar módulos:', error);
      req.flash('error', 'Erro ao carregar módulos.');
      res.redirect('/admin');
    }
  }

  // Salvar configurações de módulos
  async update(req, res) {
    try {
      const moduleSettings = [
        { key: 'module_petitions', label: 'Módulo de Petições' }
        // Adicionar mais módulos aqui no futuro
      ];

      for (const mod of moduleSettings) {
        const value = req.body[mod.key] === 'true' ? 'true' : 'false';
        
        const existing = await Setting.findOne({ where: { key: mod.key } });
        
        if (existing) {
          await Setting.update(
            { value },
            { where: { key: mod.key } }
          );
        } else {
          await Setting.create({
            key: mod.key,
            value,
            type: 'boolean',
            group: 'modules',
            label: mod.label
          });
        }
      }

      // Limpar cache de configurações
      clearSettingsCache();

      req.flash('success', 'Módulos atualizados com sucesso!');
      res.redirect('/admin/modules');
    } catch (error) {
      console.error('Erro ao salvar módulos:', error);
      req.flash('error', 'Erro ao salvar módulos: ' + error.message);
      res.redirect('/admin/modules');
    }
  }
}

module.exports = new ModulesController();
