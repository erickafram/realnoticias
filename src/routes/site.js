/**
 * Rotas do Site Público
 */
const express = require('express');
const router = express.Router();
const SiteController = require('../controllers/SiteController');
const BannerController = require('../controllers/BannerController');
const PetitionSiteController = require('../controllers/PetitionSiteController');
const PetitionerController = require('../controllers/PetitionerController');
const AuthUnifiedController = require('../controllers/AuthUnifiedController');
const { uploadSingle } = require('../middlewares/upload');
const { SitemapStream, streamToPromise } = require('sitemap');
const { Post, Category, Page } = require('../models');

// Middleware para verificar se peticionário está logado
const isPetitionerAuthenticated = (req, res, next) => {
  if (req.session && req.session.petitioner) {
    return next();
  }
  req.flash('error', 'Faça login para acessar esta página.');
  return res.redirect('/login');
};

// Middleware para verificar se o módulo de petições está ativo
const isPetitionsModuleActive = (req, res, next) => {
  if (res.locals.modulePetitions) {
    return next();
  }
  req.flash('error', 'O módulo de petições está desativado.');
  return res.redirect('/');
};

// ==========================================
// LOGIN UNIFICADO
// ==========================================
router.get('/login', AuthUnifiedController.showLogin);
router.post('/login', AuthUnifiedController.login);
router.get('/logout', AuthUnifiedController.logout);

// Página inicial
router.get('/', SiteController.home);

// Listagem de notícias
router.get('/noticias', SiteController.posts);

// Post individual
router.get('/noticia/:slug', SiteController.post);

// Listagem de categorias
router.get('/categorias', SiteController.categories);

// Categoria individual
router.get('/categoria/:slug', SiteController.category);

// Subcategoria individual
router.get('/subcategoria/:slug', SiteController.subcategory);

// Tag
router.get('/tag/:tag', SiteController.tag);

// Busca
router.get('/busca', SiteController.search);

// ==========================================
// PETIÇÕES PÚBLICAS
// ==========================================
router.get('/peticoes', isPetitionsModuleActive, PetitionSiteController.index);
router.get('/peticao/:slug', isPetitionsModuleActive, PetitionSiteController.show);
router.post('/peticao/:slug/assinar', isPetitionsModuleActive, PetitionSiteController.sign);
router.get('/peticao/:slug/assinaturas', isPetitionsModuleActive, PetitionSiteController.loadSignatures);

// ==========================================
// ÁREA DO CIDADÃO (PETICIONÁRIO)
// ==========================================
// Autenticação
router.get('/cidadao/login', isPetitionsModuleActive, PetitionerController.showLogin);
router.post('/cidadao/login', isPetitionsModuleActive, PetitionerController.login);
router.get('/cidadao/logout', PetitionerController.logout);

// Criar petição (com cadastro)
router.get('/criar-peticao', isPetitionsModuleActive, PetitionerController.showCreatePetition);
router.post('/criar-peticao', isPetitionsModuleActive, ...uploadSingle('image'), PetitionerController.createPetition);

// Painel do cidadão (requer login)
router.get('/minha-conta', isPetitionsModuleActive, isPetitionerAuthenticated, PetitionerController.dashboard);
router.get('/minha-conta/peticao/:id', isPetitionsModuleActive, isPetitionerAuthenticated, PetitionerController.viewPetition);
router.get('/minha-conta/perfil', isPetitionsModuleActive, isPetitionerAuthenticated, PetitionerController.showProfile);
router.post('/minha-conta/perfil', isPetitionsModuleActive, isPetitionerAuthenticated, PetitionerController.updateProfile);

// Registrar clique em banner (API)
router.post('/api/banner/:id/click', BannerController.registerClick);

// Sitemap Index (lista todos os sitemaps)
router.get('/sitemap.xml', async (req, res) => {
  try {
    const siteUrl = process.env.SITE_URL || `http://${req.headers.host}`;
    const categories = await Category.findAll({ where: { active: true } });
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Sitemap principal (páginas estáticas)
    xml += `  <sitemap>\n`;
    xml += `    <loc>${siteUrl}/sitemap-main.xml</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    xml += `  </sitemap>\n`;
    
    // Sitemap por categoria
    for (const cat of categories) {
      xml += `  <sitemap>\n`;
      xml += `    <loc>${siteUrl}/sitemap-categoria-${cat.slug}.xml</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
      xml += `  </sitemap>\n`;
    }
    
    // Sitemap Google News
    xml += `  <sitemap>\n`;
    xml += `    <loc>${siteUrl}/sitemap-news.xml</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    xml += `  </sitemap>\n`;
    
    xml += '</sitemapindex>';
    
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Erro ao gerar sitemap index:', error);
    res.status(500).send('Erro ao gerar sitemap');
  }
});

// Sitemap Principal (páginas estáticas e categorias)
router.get('/sitemap-main.xml', async (req, res) => {
  try {
    const siteUrl = process.env.SITE_URL || `http://${req.headers.host}`;
    const smStream = new SitemapStream({ hostname: siteUrl });

    // Página inicial
    smStream.write({ url: '/', changefreq: 'daily', priority: 1.0 });

    // Página de notícias
    smStream.write({ url: '/noticias', changefreq: 'hourly', priority: 0.9 });

    // Páginas estáticas
    const pages = await Page.findAll({ where: { status: 'published' } });
    pages.forEach(page => {
      smStream.write({
        url: `/pagina/${page.slug}`,
        changefreq: 'monthly',
        priority: 0.7,
        lastmod: page.updated_at
      });
    });

    // Categorias
    const categories = await Category.findAll({ where: { active: true } });
    categories.forEach(cat => {
      smStream.write({
        url: `/categoria/${cat.slug}`,
        changefreq: 'daily',
        priority: 0.8
      });
    });

    smStream.end();

    const sitemap = await streamToPromise(smStream);
    res.header('Content-Type', 'application/xml');
    res.send(sitemap.toString());
  } catch (error) {
    console.error('Erro ao gerar sitemap principal:', error);
    res.status(500).send('Erro ao gerar sitemap');
  }
});

// Sitemap por Categoria (posts de cada categoria)
router.get('/sitemap-categoria-:slug.xml', async (req, res) => {
  try {
    const siteUrl = process.env.SITE_URL || `http://${req.headers.host}`;
    const { slug } = req.params;
    
    const category = await Category.findOne({ where: { slug, active: true } });
    if (!category) {
      return res.status(404).send('Categoria não encontrada');
    }

    const smStream = new SitemapStream({ hostname: siteUrl });

    // Posts da categoria
    const posts = await Post.findAll({
      where: { 
        status: 'published',
        category_id: category.id
      },
      order: [['published_at', 'DESC']],
      limit: 1000
    });

    posts.forEach(post => {
      smStream.write({
        url: `/noticia/${post.slug}`,
        changefreq: 'weekly',
        priority: 0.9,
        lastmod: post.updated_at
      });
    });

    smStream.end();

    const sitemap = await streamToPromise(smStream);
    res.header('Content-Type', 'application/xml');
    res.send(sitemap.toString());
  } catch (error) {
    console.error('Erro ao gerar sitemap de categoria:', error);
    res.status(500).send('Erro ao gerar sitemap');
  }
});

// Sitemap Google News (notícias dos últimos 2 dias)
router.get('/sitemap-news.xml', async (req, res) => {
  try {
    const siteUrl = process.env.SITE_URL || `http://${req.headers.host}`;
    const { Setting } = require('../models');
    
    // Buscar nome do site nas configurações
    const siteNameSetting = await Setting.findOne({ where: { key: 'site_name' } });
    const siteName = siteNameSetting?.value || 'Portal de Notícias';
    
    // Posts dos últimos 2 dias (requisito do Google News)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const posts = await Post.findAll({
      where: { 
        status: 'published',
        published_at: {
          [require('sequelize').Op.gte]: twoDaysAgo
        }
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['name']
      }],
      order: [['published_at', 'DESC']],
      limit: 1000
    });

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n';

    posts.forEach(post => {
      const pubDate = new Date(post.published_at);
      const formattedDate = pubDate.toISOString().split('T')[0];
      
      xml += '  <url>\n';
      xml += `    <loc>${siteUrl}/noticia/${post.slug}</loc>\n`;
      xml += '    <news:news>\n';
      xml += '      <news:publication>\n';
      xml += `        <news:name>${escapeXml(siteName)}</news:name>\n`;
      xml += '        <news:language>pt</news:language>\n';
      xml += '      </news:publication>\n';
      xml += `      <news:publication_date>${formattedDate}</news:publication_date>\n`;
      xml += `      <news:title>${escapeXml(post.title)}</news:title>\n`;
      if (post.category) {
        xml += `      <news:keywords>${escapeXml(post.category.name)}</news:keywords>\n`;
      }
      xml += '    </news:news>\n';
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Erro ao gerar sitemap news:', error);
    res.status(500).send('Erro ao gerar sitemap');
  }
});

// Função auxiliar para escapar XML
function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Robots.txt
router.get('/robots.txt', (req, res) => {
  const siteUrl = process.env.SITE_URL || `http://${req.headers.host}`;
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /minha-conta/
Disallow: /cidadao/

Sitemap: ${siteUrl}/sitemap.xml
Sitemap: ${siteUrl}/sitemap-news.xml`);
});

// Página estática (deve ser a última rota com parâmetro)
router.get('/pagina/:slug', SiteController.page);

module.exports = router;
