/**
 * Middleware de Autenticação
 * Gerencia autenticação e autorização de usuários
 */

// Verificar se o usuário está autenticado
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  
  req.flash('error', 'Você precisa estar logado para acessar esta página.');
  return res.redirect('/admin/login');
};

// Verificar se o usuário NÃO está autenticado (para páginas de login)
const isNotAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return res.redirect('/admin');
  }
  return next();
};

// Verificar se o usuário é administrador
const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  
  req.flash('error', 'Você não tem permissão para acessar esta página.');
  return res.redirect('/admin');
};

// Verificar se o usuário é administrador ou gestor
const isAdminOrGestor = (req, res, next) => {
  if (req.session && req.session.user) {
    const role = req.session.user.role;
    if (role === 'admin' || role === 'gestor') {
      return next();
    }
  }
  
  req.flash('error', 'Você não tem permissão para acessar esta página.');
  return res.redirect('/admin');
};

// Verificar se o usuário é editor ou admin
const isEditorOrAdmin = (req, res, next) => {
  if (req.session && req.session.user) {
    const role = req.session.user.role;
    if (role === 'admin' || role === 'editor') {
      return next();
    }
  }
  
  req.flash('error', 'Você não tem permissão para acessar esta página.');
  return res.redirect('/admin');
};

// Middleware para adicionar usuário às views
const addUserToLocals = (req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  next();
};

// Middleware para adicionar mensagens flash às views
const addFlashMessages = (req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.warning = req.flash('warning');
  res.locals.info = req.flash('info');
  next();
};

module.exports = {
  isAuthenticated,
  isNotAuthenticated,
  isAdmin,
  isAdminOrGestor,
  isEditorOrAdmin,
  addUserToLocals,
  addFlashMessages
};
