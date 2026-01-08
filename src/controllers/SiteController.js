/**
 * Controller do Site Público
 * Gerencia todas as páginas do frontend
 */
const { Post, Category, Subcategory, Page, User, Setting, HomeBlock, Banner, sequelize } = require('../models');
const { Op } = require('sequelize');
const { getBanners } = require('../helpers/bannerHelper');

class SiteController {
  // Página inicial
  async home(req, res) {
    try {
      // Posts em destaque
      const featuredPosts = await Post.findAll({
        where: { status: 'published', featured: true },
        include: [
          { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
          { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'color'] }
        ],
        order: [['published_at', 'DESC']],
        limit: 5
      });

      // Últimas notícias
      const latestPosts = await Post.findAll({
        where: { status: 'published' },
        include: [
          { model: User, as: 'author', attributes: ['id', 'name'] },
          { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'color'] }
        ],
        order: [['published_at', 'DESC']],
        limit: 12
      });

      // Posts mais vistos
      const popularPosts = await Post.findAll({
        where: { status: 'published' },
        include: [
          { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'color'] }
        ],
        order: [['views', 'DESC']],
        limit: 5
      });

      // Posts por categoria (para seções)
      const categoriesWithPosts = await Category.findAll({
        where: { active: true },
        include: [{
          model: Post,
          as: 'posts',
          where: { status: 'published' },
          required: false,
          limit: 4,
          order: [['published_at', 'DESC']],
          include: [{ model: User, as: 'author', attributes: ['name'] }]
        }],
        order: [['order', 'ASC']]
      });

      // Buscar banners da home
      const banners = await getBanners(['home_top', 'home_middle', 'home_bottom', 'home_sidebar']);
      
      // Buscar todos os banners para o editor
      const { Banner } = require('../models');
      const allBanners = await Banner.findAll({
        order: [['title', 'ASC']]
      });

      // Buscar blocos configurados da home (com tratamento de erro caso tabela não exista)
      let blocksWithPosts = [];
      try {
        const homeBlocks = await HomeBlock.findAll({
          where: { active: true },
          order: [['order', 'ASC']],
          include: [
            { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'color'] },
            { model: Banner, as: 'banner' }
          ]
        });

        // Carregar posts para cada bloco
        blocksWithPosts = await Promise.all(homeBlocks.map(async (block) => {
          const blockData = block.toJSON();
          
          if (block.type === 'banner') {
            return blockData;
          }

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
            include: [
              { model: User, as: 'author', attributes: ['id', 'name'] },
              { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'color'] }
            ],
            order: [['published_at', 'DESC']],
            limit: block.posts_count || 4,
            offset: block.offset || 0
          });

          blockData.posts = posts;
          return blockData;
        }));
      } catch (blockError) {
        console.error('Erro ao carregar blocos da home (tabela pode não existir):', blockError.message);
        // Continua sem blocos - vai usar o fallback na view
      }

      res.render('site/home', {
        title: 'Início',
        metaDescription: res.locals.settings.site_description,
        featuredPosts,
        latestPosts,
        popularPosts,
        categoriesWithPosts,
        banners,
        allBanners, // Para o editor de blocos
        homeBlocks: blocksWithPosts
      });
    } catch (error) {
      console.error('Erro na página inicial:', error);
      res.render('site/error', {
        title: 'Erro',
        message: 'Ocorreu um erro ao carregar a página.'
      });
    }
  }

  // Listagem de notícias
  async posts(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(res.locals.settings.posts_per_page) || 12;
      const offset = (page - 1) * limit;

      // Filtros
      const where = { status: 'published' };

      if (req.query.category) {
        const category = await Category.findOne({ where: { slug: req.query.category } });
        if (category) {
          where.category_id = category.id;
        }
      }

      if (req.query.search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${req.query.search}%` } },
          { content: { [Op.like]: `%${req.query.search}%` } },
          { tags: { [Op.like]: `%${req.query.search}%` } }
        ];
      }

      const { count, rows: posts } = await Post.findAndCountAll({
        where,
        include: [
          { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
          { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'color'] }
        ],
        order: [['published_at', 'DESC']],
        limit,
        offset
      });

      const totalPages = Math.ceil(count / limit);

      res.render('site/posts/index', {
        title: 'Notícias',
        metaDescription: 'Confira as últimas notícias do Portal Convictos',
        posts,
        pagination: {
          page,
          totalPages,
          total: count,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters: req.query
      });
    } catch (error) {
      console.error('Erro ao listar posts:', error);
      res.render('site/error', {
        title: 'Erro',
        message: 'Ocorreu um erro ao carregar as notícias.'
      });
    }
  }

  // Página de post individual
  async post(req, res) {
    try {
      const post = await Post.findOne({
        where: { slug: req.params.slug, status: 'published' },
        include: [
          { model: User, as: 'author', attributes: ['id', 'name', 'avatar', 'bio'] },
          { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'color'] }
        ]
      });

      if (!post) {
        return res.status(404).render('site/404', {
          title: 'Página não encontrada'
        });
      }

      // Incrementar visualizações
      await post.incrementViews();

      // Posts relacionados (mesma categoria)
      const relatedPosts = await Post.findAll({
        where: {
          status: 'published',
          id: { [Op.ne]: post.id },
          category_id: post.category_id
        },
        include: [
          { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'color'] }
        ],
        order: [['published_at', 'DESC']],
        limit: 4
      });

      // Posts mais vistos
      const popularPosts = await Post.findAll({
        where: { status: 'published', id: { [Op.ne]: post.id } },
        order: [['views', 'DESC']],
        limit: 5
      });

      // Buscar banners do post
      const banners = await getBanners(['post_top', 'post_middle', 'post_bottom', 'post_sidebar']);

      res.render('site/posts/show', {
        title: post.meta_title || post.title,
        metaDescription: post.meta_description || post.excerpt || post.subtitle,
        ogImage: post.featured_image,
        ogType: 'article',
        post,
        relatedPosts,
        popularPosts,
        banners
      });
    } catch (error) {
      console.error('Erro ao carregar post:', error);
      res.render('site/error', {
        title: 'Erro',
        message: 'Ocorreu um erro ao carregar a notícia.'
      });
    }
  }

  // Página de categoria
  async category(req, res) {
    try {
      const category = await Category.findOne({
        where: { slug: req.params.slug, active: true }
      });

      if (!category) {
        return res.status(404).render('site/404', {
          title: 'Categoria não encontrada'
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(res.locals.settings.posts_per_page) || 12;
      const offset = (page - 1) * limit;

      const { count, rows: posts } = await Post.findAndCountAll({
        where: { status: 'published', category_id: category.id },
        include: [
          { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
          { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'color'] }
        ],
        order: [['published_at', 'DESC']],
        limit,
        offset
      });

      const totalPages = Math.ceil(count / limit);

      // Buscar banners da categoria
      const banners = await getBanners(['category_top', 'category_bottom', 'category_sidebar']);

      res.render('site/category', {
        title: category.name,
        metaDescription: category.description || `Notícias sobre ${category.name}`,
        category,
        posts,
        pagination: {
          page,
          totalPages,
          total: count,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        banners
      });
    } catch (error) {
      console.error('Erro ao carregar categoria:', error);
      res.render('site/error', {
        title: 'Erro',
        message: 'Ocorreu um erro ao carregar a categoria.'
      });
    }
  }

  // Página de subcategoria
  async subcategory(req, res) {
    try {
      const subcategory = await Subcategory.findOne({
        where: { slug: req.params.slug, active: true },
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'color']
        }]
      });

      if (!subcategory) {
        return res.status(404).render('site/404', {
          title: 'Subcategoria não encontrada'
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(res.locals.settings.posts_per_page) || 12;
      const offset = (page - 1) * limit;

      // Por enquanto, busca posts da categoria pai
      // TODO: Adicionar subcategory_id no Post model futuramente
      const { count, rows: posts } = await Post.findAndCountAll({
        where: { status: 'published', category_id: subcategory.category_id },
        include: [
          { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
          { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'color'] }
        ],
        order: [['published_at', 'DESC']],
        limit,
        offset
      });

      const totalPages = Math.ceil(count / limit);

      // Buscar banners da subcategoria (usa os mesmos da categoria)
      const banners = await getBanners(['category_top', 'category_bottom', 'category_sidebar']);

      res.render('site/subcategory', {
        title: subcategory.name,
        metaDescription: subcategory.description || `Notícias sobre ${subcategory.name}`,
        subcategory,
        posts,
        pagination: {
          page,
          totalPages,
          total: count,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        banners
      });
    } catch (error) {
      console.error('Erro ao carregar subcategoria:', error);
      res.render('site/error', {
        title: 'Erro',
        message: 'Ocorreu um erro ao carregar a subcategoria.'
      });
    }
  }

  // Listagem de categorias
  async categories(req, res) {
    try {
      const categories = await Category.findAll({
        where: { active: true },
        include: [{
          model: Post,
          as: 'posts',
          where: { status: 'published' },
          required: false,
          attributes: ['id']
        }],
        order: [['order', 'ASC'], ['name', 'ASC']]
      });

      // Adicionar contagem de posts
      const categoriesWithCount = categories.map(cat => ({
        ...cat.toJSON(),
        postCount: cat.posts ? cat.posts.length : 0
      }));

      res.render('site/categories', {
        title: 'Categorias',
        metaDescription: 'Explore todas as categorias do Portal Convictos',
        categories: categoriesWithCount
      });
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      res.render('site/error', {
        title: 'Erro',
        message: 'Ocorreu um erro ao carregar as categorias.'
      });
    }
  }

  // Página estática
  async page(req, res) {
    try {
      const page = await Page.findOne({
        where: { slug: req.params.slug, status: 'published' },
        include: [{ model: User, as: 'author', attributes: ['id', 'name'] }]
      });

      if (!page) {
        return res.status(404).render('site/404', {
          title: 'Página não encontrada'
        });
      }

      // Escolher template baseado no campo template
      const template = page.template === 'contact' ? 'site/pages/contact' : 'site/pages/default';

      res.render(template, {
        title: page.meta_title || page.title,
        metaDescription: page.meta_description,
        page
      });
    } catch (error) {
      console.error('Erro ao carregar página:', error);
      res.render('site/error', {
        title: 'Erro',
        message: 'Ocorreu um erro ao carregar a página.'
      });
    }
  }

  // Busca
  async search(req, res) {
    try {
      const query = req.query.q || '';
      const page = parseInt(req.query.page) || 1;
      const limit = 12;
      const offset = (page - 1) * limit;

      if (!query.trim()) {
        return res.render('site/search', {
          title: 'Busca',
          query: '',
          posts: [],
          pagination: { page: 1, totalPages: 0, total: 0 }
        });
      }

      const { count, rows: posts } = await Post.findAndCountAll({
        where: {
          status: 'published',
          [Op.or]: [
            { title: { [Op.like]: `%${query}%` } },
            { subtitle: { [Op.like]: `%${query}%` } },
            { content: { [Op.like]: `%${query}%` } },
            { tags: { [Op.like]: `%${query}%` } }
          ]
        },
        include: [
          { model: User, as: 'author', attributes: ['id', 'name'] },
          { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'color'] }
        ],
        order: [['published_at', 'DESC']],
        limit,
        offset
      });

      const totalPages = Math.ceil(count / limit);

      res.render('site/search', {
        title: `Busca: ${query}`,
        metaDescription: `Resultados da busca por "${query}"`,
        query,
        posts,
        pagination: {
          page,
          totalPages,
          total: count,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error('Erro na busca:', error);
      res.render('site/error', {
        title: 'Erro',
        message: 'Ocorreu um erro ao realizar a busca.'
      });
    }
  }

  // Tag
  async tag(req, res) {
    try {
      const tag = req.params.tag;
      const page = parseInt(req.query.page) || 1;
      const limit = 12;
      const offset = (page - 1) * limit;

      const { count, rows: posts } = await Post.findAndCountAll({
        where: {
          status: 'published',
          tags: { [Op.like]: `%${tag}%` }
        },
        include: [
          { model: User, as: 'author', attributes: ['id', 'name'] },
          { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'color'] }
        ],
        order: [['published_at', 'DESC']],
        limit,
        offset
      });

      const totalPages = Math.ceil(count / limit);

      res.render('site/tag', {
        title: `Tag: ${tag}`,
        metaDescription: `Posts com a tag "${tag}"`,
        tag,
        posts,
        pagination: {
          page,
          totalPages,
          total: count,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error('Erro ao carregar tag:', error);
      res.render('site/error', {
        title: 'Erro',
        message: 'Ocorreu um erro ao carregar os posts.'
      });
    }
  }

  // Página 404
  async notFound(req, res) {
    res.status(404).render('site/404', {
      title: 'Página não encontrada'
    });
  }
}

module.exports = new SiteController();
