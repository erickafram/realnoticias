/**
 * Rotas do Painel Administrativo
 */
const express = require('express');
const router = express.Router();

// Controllers
const AuthController = require('../controllers/AuthController');
const DashboardController = require('../controllers/DashboardController');
const PostController = require('../controllers/PostController');
const CategoryController = require('../controllers/CategoryController');
const SubcategoryController = require('../controllers/SubcategoryController');
const PageController = require('../controllers/PageController');
const UserController = require('../controllers/UserController');
const MediaController = require('../controllers/MediaController');
const SettingController = require('../controllers/SettingController');
const BannerController = require('../controllers/BannerController');
const HomeEditorController = require('../controllers/HomeEditorController');
const AIController = require('../controllers/AIController');
const PetitionController = require('../controllers/PetitionController');
const STFController = require('../controllers/STFController');
const ApiSettingsController = require('../controllers/ApiSettingsController');
const ModulesController = require('../controllers/ModulesController');

// Middlewares
const { isAuthenticated, isNotAuthenticated, isAdmin, isAdminOrGestor, isAdminGestorOrEditor } = require('../middlewares/auth');
const { uploadSingle, uploadMultiple } = require('../middlewares/upload');
const {
  validate,
  loginValidation,
  postValidation,
  categoryValidation,
  pageValidation,
  userValidation
} = require('../middlewares/validators');

// ==========================================
// ROTAS DE AUTENTICAÇÃO
// ==========================================
router.get('/login', isNotAuthenticated, AuthController.showLogin);
router.post('/login', isNotAuthenticated, loginValidation, validate, AuthController.login);
router.get('/logout', AuthController.logout);

// ==========================================
// ROTAS PROTEGIDAS (requer autenticação)
// ==========================================
router.use(isAuthenticated);

// Dashboard
router.get('/', DashboardController.index);

// Perfil do usuário
router.get('/profile', AuthController.showProfile);
router.post('/profile', ...uploadSingle('avatar'), AuthController.updateProfile);

// ==========================================
// POSTS
// ==========================================
router.get('/posts', PostController.index);
router.get('/posts/create', PostController.create);
router.post('/posts', ...uploadSingle('featured_image'), PostController.store);
router.post('/posts/delete-multiple', PostController.destroyMultiple);
router.get('/posts/:id/edit', PostController.edit);
router.post('/posts/:id', ...uploadSingle('featured_image'), PostController.update);
router.post('/posts/:id/delete', PostController.destroy);
router.post('/posts/:id/toggle-featured', PostController.toggleFeatured);
router.post('/posts/:id/toggle-status', PostController.toggleStatus);

// ==========================================
// CATEGORIAS
// ==========================================
router.get('/categories', CategoryController.index);
router.get('/categories/create', CategoryController.create);
router.post('/categories', CategoryController.store);
router.post('/categories/reorder', CategoryController.reorder);
router.get('/categories/:id/edit', CategoryController.edit);
router.post('/categories/:id', CategoryController.update);
router.post('/categories/:id/delete', CategoryController.destroy);
router.post('/categories/:id/toggle-active', CategoryController.toggleActive);

// ==========================================
// SUBCATEGORIAS
// ==========================================
router.get('/subcategories', SubcategoryController.index);
router.get('/subcategories/create', SubcategoryController.create);
router.post('/subcategories', SubcategoryController.store);
router.get('/subcategories/:id/edit', SubcategoryController.edit);
router.post('/subcategories/:id', SubcategoryController.update);
router.post('/subcategories/:id/delete', SubcategoryController.destroy);
router.post('/subcategories/:id/toggle-active', SubcategoryController.toggleActive);

// ==========================================
// PÁGINAS
// ==========================================
router.get('/pages', PageController.index);
router.get('/pages/create', PageController.create);
router.post('/pages', ...uploadSingle('featured_image'), PageController.store);
router.get('/pages/:id/edit', PageController.edit);
router.post('/pages/:id', ...uploadSingle('featured_image'), PageController.update);
router.post('/pages/:id/delete', PageController.destroy);
router.post('/pages/:id/toggle-status', PageController.toggleStatus);

// ==========================================
// MÍDIA
// ==========================================
router.get('/media', MediaController.index);
router.post('/media/upload', ...uploadSingle('file'), MediaController.upload);
router.post('/media/upload-multiple', ...uploadMultiple('files', 10), MediaController.uploadMultiple);
router.get('/media/browse', MediaController.browse);
router.get('/media/:id', MediaController.show);
router.post('/media/:id', MediaController.update);
router.post('/media/:id/delete', MediaController.destroy);

// ==========================================
// BANNERS
// ==========================================
router.get('/banners', BannerController.index);
router.get('/banners/create', BannerController.create);
router.post('/banners', ...uploadSingle('image'), BannerController.store);
router.get('/banners/:id/edit', BannerController.edit);
router.post('/banners/:id', ...uploadSingle('image'), BannerController.update);
router.post('/banners/:id/delete', BannerController.destroy);
router.post('/banners/:id/toggle-active', BannerController.toggleActive);

// ==========================================
// ROTAS APENAS PARA ADMIN E GESTOR
// ==========================================
router.use('/users', isAdminOrGestor);

// ==========================================
// ROTAS PARA ADMIN, GESTOR E EDITOR
// ==========================================
router.use('/settings', isAdminGestorOrEditor);

// ==========================================
// ROTAS APENAS PARA ADMIN
// ==========================================
router.use('/api', isAdmin);
router.use('/modules', isAdmin);

// ==========================================
// USUÁRIOS (apenas admin)
// ==========================================
router.get('/users', UserController.index);
router.get('/users/create', UserController.create);
router.post('/users', ...uploadSingle('avatar'), UserController.store);
router.get('/users/:id/edit', UserController.edit);
router.post('/users/:id', ...uploadSingle('avatar'), UserController.update);
router.post('/users/:id/delete', UserController.destroy);
router.post('/users/:id/toggle-active', UserController.toggleActive);

// ==========================================
// CONFIGURAÇÕES (apenas admin e gestor)
// ==========================================
router.get('/settings', SettingController.index);
router.post('/settings', SettingController.update);
router.post('/settings/upload-logo', ...uploadSingle('logo'), SettingController.uploadLogo);
router.post('/settings/remove-logo', SettingController.removeLogo);

// ==========================================
// API (apenas admin)
// ==========================================
router.get('/api', ApiSettingsController.index);
router.post('/api', ApiSettingsController.update);

// ==========================================
// MÓDULOS (apenas admin)
// ==========================================
router.get('/modules', ModulesController.index);
router.post('/modules', ModulesController.update);

// ==========================================
// EDITOR DA HOME
// ==========================================
router.get('/home-editor', HomeEditorController.index);
router.post('/home-editor/blocks', HomeEditorController.addBlock);
router.post('/home-editor/blocks/:id', HomeEditorController.updateBlock);
router.post('/home-editor/blocks/:id/delete', HomeEditorController.deleteBlock);
router.post('/home-editor/blocks/:id/toggle', HomeEditorController.toggleActive);
router.post('/home-editor/reorder', HomeEditorController.reorderBlocks);
router.get('/home-editor/blocks/:id/preview', HomeEditorController.previewBlock);

// ==========================================
// ASSISTENTE DE IA
// ==========================================
router.get('/ai/status', AIController.status.bind(AIController));
router.post('/ai/generate', AIController.generateArticle.bind(AIController));
router.post('/ai/improve-title', AIController.improveTitle.bind(AIController));
router.post('/ai/improve-subtitle', AIController.improveSubtitle.bind(AIController));
router.post('/ai/improve-content', AIController.improveContent.bind(AIController));

// ==========================================
// INTEGRAÇÃO STF
// ==========================================
router.get('/stf/process', STFController.fetchProcess.bind(STFController));
router.post('/stf/generate', STFController.generateArticle.bind(STFController));

// ==========================================
// PETIÇÕES
// ==========================================
router.get('/petitions', PetitionController.index);
router.get('/petitions/create', PetitionController.create);
router.post('/petitions', ...uploadSingle('image'), PetitionController.store);
router.get('/petitions/:id/edit', PetitionController.edit);
router.post('/petitions/:id', ...uploadSingle('image'), PetitionController.update);
router.post('/petitions/:id/delete', PetitionController.destroy);
router.get('/petitions/:id/signatures', PetitionController.signatures);
router.get('/petitions/:id/export', PetitionController.exportSignatures);
router.post('/petitions/:id/toggle-status', PetitionController.toggleStatus);
router.get('/petitions/:id/review', PetitionController.review);
router.post('/petitions/:id/approve', PetitionController.approve);
router.post('/petitions/:id/reject', PetitionController.reject);

module.exports = router;
