/**
 * HomeEditorController
 * Gerencia o editor visual da página inicial
 */
const { HomeBlock, Category, Banner, Post } = require('../models');

class HomeEditorController {
  // Exibir editor visual
  async index(req, res) {
    try {
      // Tentar buscar blocos (pode falhar se tabela não existir)
      let blocks = [];
      try {
        blocks = await HomeBlock.findAll({
          order: [['order', 'ASC']],
          include: [
            { model: Category, as: 'category', attributes: ['id', 'name', 'color'] },
            { model: Banner, as: 'banner', attributes: ['id', 'title', 'image'] }
          ]
        });
      } catch (blockError) {
        console.error('Tabela home_blocks pode não existir. Execute a migration:', blockError.message);
        // Continua com array vazio
      }

      const categories = await Category.findAll({
        where: { active: true, parent_id: null },
        order: [['name', 'ASC']]
      });

      const banners = await Banner.findAll({
        order: [['title', 'ASC']]
      });

      res.render('admin/home-editor/index', {
        title: 'Editor da Home',
        blocks,
        categories,
        banners,
        blockTypes: [
          { value: 'featured', label: 'Destaque Principal', icon: 'bi-star-fill', description: '1 notícia grande + 2 pequenas' },
          { value: 'grid-3', label: 'Grid 3 Colunas', icon: 'bi-grid-3x2-gap', description: '3 notícias em cards iguais' },
          { value: 'grid-4', label: 'Grid 4 Colunas', icon: 'bi-grid', description: '4 notícias em cards iguais' },
          { value: 'list-vertical', label: 'Lista Vertical', icon: 'bi-list-ul', description: 'Notícias em lista com imagem pequena' },
          { value: 'big-left', label: 'Grande à Esquerda', icon: 'bi-layout-sidebar', description: '1 grande + lista à direita' },
          { value: 'big-right', label: 'Grande à Direita', icon: 'bi-layout-sidebar-reverse', description: 'Lista à esquerda + 1 grande' },
          { value: 'carousel', label: 'Carrossel', icon: 'bi-collection-play', description: 'Slider de notícias' },
          { value: 'banner', label: 'Banner', icon: 'bi-image', description: 'Banner publicitário' }
        ]
      });
    } catch (error) {
      console.error('Erro ao carregar editor:', error);
      req.flash('error', 'Erro ao carregar editor da home. Verifique se a migration foi executada.');
      res.redirect('/admin');
    }
  }

  // Adicionar novo bloco
  async addBlock(req, res) {
    try {
      const { type, title, category_id, category_ids, banner_id, posts_count, show_title, show_excerpt, show_date, show_category, background_color, offset } = req.body;

      // Pegar a maior ordem atual
      const maxOrder = await HomeBlock.max('order') || 0;

      // Helper para converter valor para boolean
      const toBool = (val) => val === true || val === 'true' || val === '1';

      const block = await HomeBlock.create({
        type,
        title: title || null,
        category_id: category_id || null,
        category_ids: category_ids || null,
        banner_id: type === 'banner' ? banner_id : null,
        posts_count: posts_count || 4,
        show_title: toBool(show_title),
        show_excerpt: toBool(show_excerpt),
        show_date: toBool(show_date),
        show_category: toBool(show_category),
        background_color: background_color || '#ffffff',
        offset: offset || 0,
        order: maxOrder + 1,
        active: true
      });

      res.json({ success: true, block });
    } catch (error) {
      console.error('Erro ao adicionar bloco:', error);
      res.json({ success: false, message: 'Erro ao adicionar bloco.' });
    }
  }

  // Atualizar bloco
  async updateBlock(req, res) {
    try {
      const { id } = req.params;
      const { type, title, category_id, category_ids, banner_id, posts_count, show_title, show_excerpt, show_date, show_category, background_color, offset, active } = req.body;

      const block = await HomeBlock.findByPk(id);
      if (!block) {
        return res.json({ success: false, message: 'Bloco não encontrado.' });
      }

      // Helper para converter valor para boolean
      const toBool = (val) => val === true || val === 'true' || val === '1';

      await block.update({
        type,
        title: title || null,
        category_id: category_id || null,
        category_ids: category_ids || null,
        banner_id: type === 'banner' ? banner_id : null,
        posts_count: posts_count || 4,
        show_title: toBool(show_title),
        show_excerpt: toBool(show_excerpt),
        show_date: toBool(show_date),
        show_category: toBool(show_category),
        background_color: background_color || '#ffffff',
        offset: offset || 0,
        active: active !== false && active !== 'false' && active !== '0'
      });

      res.json({ success: true, block });
    } catch (error) {
      console.error('Erro ao atualizar bloco:', error);
      res.json({ success: false, message: 'Erro ao atualizar bloco.' });
    }
  }

  // Excluir bloco
  async deleteBlock(req, res) {
    try {
      const { id } = req.params;

      const block = await HomeBlock.findByPk(id);
      if (!block) {
        return res.json({ success: false, message: 'Bloco não encontrado.' });
      }

      await block.destroy();
      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao excluir bloco:', error);
      res.json({ success: false, message: 'Erro ao excluir bloco.' });
    }
  }

  // Reordenar blocos
  async reorderBlocks(req, res) {
    try {
      const { items } = req.body;

      if (!items || !Array.isArray(items)) {
        return res.json({ success: false, message: 'Dados inválidos.' });
      }

      for (let i = 0; i < items.length; i++) {
        await HomeBlock.update(
          { order: i },
          { where: { id: items[i] } }
        );
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao reordenar blocos:', error);
      res.json({ success: false, message: 'Erro ao reordenar blocos.' });
    }
  }

  // Toggle ativo/inativo
  async toggleActive(req, res) {
    try {
      const { id } = req.params;

      const block = await HomeBlock.findByPk(id);
      if (!block) {
        return res.json({ success: false, message: 'Bloco não encontrado.' });
      }

      await block.update({ active: !block.active });
      res.json({ success: true, active: block.active });
    } catch (error) {
      console.error('Erro ao alternar status:', error);
      res.json({ success: false, message: 'Erro ao alternar status.' });
    }
  }

  // Preview de um bloco (retorna HTML)
  async previewBlock(req, res) {
    try {
      const { id } = req.params;

      const block = await HomeBlock.findByPk(id, {
        include: [
          { model: Category, as: 'category' },
          { model: Banner, as: 'banner' }
        ]
      });

      if (!block) {
        return res.json({ success: false, message: 'Bloco não encontrado.' });
      }

      // Buscar posts para o preview
      const whereClause = { status: 'published' };

      if (block.category_ids) {
        const ids = String(block.category_ids)
          .split(',')
          .map(id => parseInt(id, 10))
          .filter(id => !Number.isNaN(id));

        if (ids.length > 0) {
          whereClause.category_id = { [require('sequelize').Op.in]: ids };
        }
      } else if (block.category_id) {
        whereClause.category_id = block.category_id;
      }

      const posts = await Post.findAll({
        where: whereClause,
        include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'color', 'slug'] }],
        order: [['published_at', 'DESC']],
        limit: block.posts_count || 4,
        offset: block.offset || 0
      });

      res.json({ success: true, block, posts });
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
      res.json({ success: false, message: 'Erro ao gerar preview.' });
    }
  }
}

module.exports = new HomeEditorController();
