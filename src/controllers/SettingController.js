/**
 * Controller de Configurações
 * Gerenciamento das configurações do site
 */
const { Setting } = require('../models');
const { clearSettingsCache } = require('../middlewares/settings');
const { deleteImage } = require('../middlewares/upload');
const path = require('path');

class SettingController {
  // Exibir página de configurações
  async index(req, res) {
    try {
      const settings = await Setting.findAll({
        order: [['group', 'ASC'], ['key', 'ASC']]
      });

      // Agrupar configurações
      const groupedSettings = {};
      settings.forEach(setting => {
        if (!groupedSettings[setting.group]) {
          groupedSettings[setting.group] = [];
        }
        groupedSettings[setting.group].push(setting);
      });

      res.render('admin/settings/index', {
        title: 'Configurações',
        groupedSettings,
        groups: {
          general: 'Geral',
          contact: 'Contato',
          social: 'Redes Sociais',
          posts: 'Posts',
          footer: 'Rodapé',
          modules: 'Módulos',
          ai: 'Assistente de IA',
          seo: 'SEO e Verificação',
          code_injection: 'Injeção de Código',
          ads: 'Anúncios'
        },
        nodeVersion: process.version,
        nodeEnv: process.env.NODE_ENV || 'development'
      });
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      req.flash('error', 'Erro ao carregar configurações.');
      res.redirect('/admin');
    }
  }

  // Salvar configurações
  async update(req, res) {
    try {
      const settings = req.body;

      // Atualizar cada configuração
      for (const [key, value] of Object.entries(settings)) {
        if (key.startsWith('_')) continue; // Ignorar campos especiais

        // Converter array/objeto para string se necessário
        let finalValue = value;
        if (Array.isArray(value)) {
          finalValue = value.join(',');
        } else if (typeof value === 'object' && value !== null) {
          finalValue = JSON.stringify(value);
        } else {
          finalValue = value || '';
        }

        // Verificar se a configuração existe
        const existing = await Setting.findOne({ where: { key } });
        
        if (existing) {
          // Atualizar existente
          await Setting.update(
            { value: finalValue },
            { where: { key } }
          );
        } else {
          // Criar nova (para cores e outras configurações dinâmicas)
          let group = 'general';
          if (key.startsWith('color_')) {
            group = 'colors';
          } else if (key === 'header_style' || key === 'logo_size') {
            group = 'layout';
          }
          
          await Setting.create({
            key,
            value: finalValue,
            type: 'text',
            group,
            label: key
          });
        }
      }

      // Limpar cache de configurações
      clearSettingsCache();

      req.flash('success', 'Configurações salvas com sucesso!');
      res.redirect('/admin/settings');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      req.flash('error', 'Erro ao salvar configurações: ' + error.message);
      res.redirect('/admin/settings');
    }
  }

  // Criar nova configuração (API)
  async create(req, res) {
    try {
      const { key, value, type, group, label, description } = req.body;

      // Verificar se já existe
      const existing = await Setting.findOne({ where: { key } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Esta chave de configuração já existe.'
        });
      }

      const setting = await Setting.create({
        key,
        value,
        type: type || 'text',
        group: group || 'general',
        label,
        description
      });

      // Limpar cache
      clearSettingsCache();

      return res.json({
        success: true,
        message: 'Configuração criada com sucesso!',
        setting
      });
    } catch (error) {
      console.error('Erro ao criar configuração:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar configuração.'
      });
    }
  }

  // Excluir configuração (API)
  async destroy(req, res) {
    try {
      const setting = await Setting.findByPk(req.params.id);

      if (!setting) {
        return res.status(404).json({
          success: false,
          message: 'Configuração não encontrada.'
        });
      }

      await setting.destroy();

      // Limpar cache
      clearSettingsCache();

      return res.json({
        success: true,
        message: 'Configuração excluída com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao excluir configuração:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao excluir configuração.'
      });
    }
  }

  // Upload de logo
  async uploadLogo(req, res) {
    try {
      if (!req.processedFile) {
        req.flash('error', 'Nenhum arquivo enviado.');
        return res.redirect('/admin/settings');
      }

      // Buscar logo atual para deletar
      const currentLogo = await Setting.findOne({ where: { key: 'site_logo' } });
      if (currentLogo && currentLogo.value) {
        // Extrair nome do arquivo da URL
        const oldFilename = path.basename(currentLogo.value);
        deleteImage(oldFilename);
      }

      // Salvar nova logo
      const logoUrl = req.processedFile.url;
      
      const [setting, created] = await Setting.findOrCreate({
        where: { key: 'site_logo' },
        defaults: {
          value: logoUrl,
          type: 'text',
          group: 'general',
          label: 'Logo do Site',
          description: 'Logo principal exibida no cabeçalho'
        }
      });

      if (!created) {
        await setting.update({ value: logoUrl });
      }

      // Limpar cache
      clearSettingsCache();

      req.flash('success', 'Logo atualizada com sucesso!');
      res.redirect('/admin/settings');
    } catch (error) {
      console.error('Erro ao fazer upload da logo:', error);
      req.flash('error', 'Erro ao fazer upload da logo: ' + error.message);
      res.redirect('/admin/settings');
    }
  }

  // Remover logo
  async removeLogo(req, res) {
    try {
      const setting = await Setting.findOne({ where: { key: 'site_logo' } });
      
      if (setting && setting.value) {
        // Deletar arquivo
        const filename = path.basename(setting.value);
        deleteImage(filename);
        
        // Limpar valor
        await setting.update({ value: '' });
        
        // Limpar cache
        clearSettingsCache();
      }

      req.flash('success', 'Logo removida com sucesso!');
      res.redirect('/admin/settings');
    } catch (error) {
      console.error('Erro ao remover logo:', error);
      req.flash('error', 'Erro ao remover logo.');
      res.redirect('/admin/settings');
    }
  }
}

module.exports = new SettingController();
