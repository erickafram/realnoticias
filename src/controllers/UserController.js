/**
 * Controller de Usuários
 * CRUD completo de usuários
 */
const { User, Post } = require('../models');
const { Op } = require('sequelize');

class UserController {
  // Listar todos os usuários (admin)
  async index(req, res) {
    try {
      const currentUserRole = req.session.user.role;
      
      // Se não for admin, não mostra usuários admin
      const whereClause = currentUserRole !== 'admin' 
        ? { role: { [Op.ne]: 'admin' } } 
        : {};

      const users = await User.findAll({
        where: whereClause,
        attributes: { exclude: ['password_hash'] },
        order: [['name', 'ASC']]
      });

      res.render('admin/users/index', {
        title: 'Usuários',
        users
      });
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      req.flash('error', 'Erro ao carregar usuários.');
      res.redirect('/admin');
    }
  }

  // Exibir formulário de criação
  async create(req, res) {
    res.render('admin/users/form', {
      title: 'Novo Usuário',
      userData: null,
      isEdit: false,
      currentUserRole: req.session.user.role
    });
  }

  // Salvar novo usuário
  async store(req, res) {
    try {
      const { name, email, password, role, bio, active } = req.body;

      // Gestor e editor não podem criar admin
      const currentUserRole = req.session.user.role;
      let finalRole = role || 'editor';
      if (currentUserRole !== 'admin' && finalRole === 'admin') {
        finalRole = 'editor'; // Força editor se tentar criar admin
      }

      // Verificar se email já existe
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        req.flash('error', 'Este email já está em uso.');
        return res.redirect('/admin/users/create');
      }

      // Validar senha
      if (!password || password.length < 6) {
        req.flash('error', 'A senha deve ter no mínimo 6 caracteres.');
        return res.redirect('/admin/users/create');
      }

      await User.create({
        name,
        email,
        password_hash: password,
        role: finalRole,
        bio,
        active: active === 'on' || active === true,
        avatar: req.processedFile ? req.processedFile.url : null
      });

      req.flash('success', 'Usuário criado com sucesso!');
      res.redirect('/admin/users');
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      req.flash('error', 'Erro ao criar usuário: ' + error.message);
      res.redirect('/admin/users/create');
    }
  }

  // Exibir formulário de edição
  async edit(req, res) {
    try {
      const userData = await User.findByPk(req.params.id, {
        attributes: { exclude: ['password_hash'] }
      });

      if (!userData) {
        req.flash('error', 'Usuário não encontrado.');
        return res.redirect('/admin/users');
      }

      // Gestor e editor não podem editar admin
      const currentUserRole = req.session.user.role;
      if (currentUserRole !== 'admin' && userData.role === 'admin') {
        req.flash('error', 'Você não tem permissão para editar este usuário.');
        return res.redirect('/admin/users');
      }

      res.render('admin/users/form', {
        title: 'Editar Usuário',
        userData,
        isEdit: true,
        currentUserRole: req.session.user.role
      });
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      req.flash('error', 'Erro ao carregar usuário.');
      res.redirect('/admin/users');
    }
  }

  // Atualizar usuário
  async update(req, res) {
    try {
      const user = await User.findByPk(req.params.id);

      if (!user) {
        req.flash('error', 'Usuário não encontrado.');
        return res.redirect('/admin/users');
      }

      // Gestor e editor não podem editar admin
      const currentUserRole = req.session.user.role;
      if (currentUserRole !== 'admin' && user.role === 'admin') {
        req.flash('error', 'Você não tem permissão para editar este usuário.');
        return res.redirect('/admin/users');
      }

      const { name, email, password, role, bio, active } = req.body;

      // Gestor e editor não podem promover para admin
      let finalRole = role || 'editor';
      if (currentUserRole !== 'admin' && finalRole === 'admin') {
        finalRole = user.role; // Mantém o role atual
      }

      // Verificar se email já existe (se alterado)
      if (email !== user.email) {
        const existingUser = await User.findOne({ 
          where: { email, id: { [Op.ne]: user.id } } 
        });
        if (existingUser) {
          req.flash('error', 'Este email já está em uso.');
          return res.redirect(`/admin/users/${user.id}/edit`);
        }
      }

      // Atualizar campos
      user.name = name;
      user.email = email;
      user.role = finalRole;
      user.bio = bio;
      user.active = active === 'on' || active === true;

      // Atualizar senha se fornecida
      if (password && password.length >= 6) {
        user.password_hash = password;
      }

      // Atualizar avatar se enviado
      if (req.processedFile) {
        user.avatar = req.processedFile.url;
      }

      await user.save();

      req.flash('success', 'Usuário atualizado com sucesso!');
      res.redirect('/admin/users');
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      req.flash('error', 'Erro ao atualizar usuário: ' + error.message);
      res.redirect(`/admin/users/${req.params.id}/edit`);
    }
  }

  // Excluir usuário
  async destroy(req, res) {
    try {
      const user = await User.findByPk(req.params.id);

      if (!user) {
        req.flash('error', 'Usuário não encontrado.');
        return res.redirect('/admin/users');
      }

      // Não permitir excluir o próprio usuário
      if (user.id === req.session.user.id) {
        req.flash('error', 'Você não pode excluir sua própria conta.');
        return res.redirect('/admin/users');
      }

      // Gestor e editor não podem excluir admin
      const currentUserRole = req.session.user.role;
      if (currentUserRole !== 'admin' && user.role === 'admin') {
        req.flash('error', 'Você não tem permissão para excluir este usuário.');
        return res.redirect('/admin/users');
      }

      // Verificar se há posts vinculados
      const postsCount = await Post.count({ where: { author_id: user.id } });
      if (postsCount > 0) {
        req.flash('error', `Não é possível excluir. Este usuário possui ${postsCount} posts.`);
        return res.redirect('/admin/users');
      }

      await user.destroy();

      req.flash('success', 'Usuário excluído com sucesso!');
      res.redirect('/admin/users');
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      req.flash('error', 'Erro ao excluir usuário.');
      res.redirect('/admin/users');
    }
  }

  // Alternar status ativo
  async toggleActive(req, res) {
    try {
      const user = await User.findByPk(req.params.id);

      if (!user) {
        return res.json({ success: false, message: 'Usuário não encontrado.' });
      }

      // Não permitir desativar o próprio usuário
      if (user.id === req.session.user.id) {
        return res.json({ success: false, message: 'Você não pode desativar sua própria conta.' });
      }

      user.active = !user.active;
      await user.save();

      return res.json({ 
        success: true, 
        active: user.active,
        message: user.active ? 'Usuário ativado!' : 'Usuário desativado!'
      });
    } catch (error) {
      console.error('Erro ao alternar status:', error);
      return res.json({ success: false, message: 'Erro ao alternar status.' });
    }
  }
}

module.exports = new UserController();
