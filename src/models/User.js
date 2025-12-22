/**
 * Model User - Usuários do sistema
 */
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'O nome é obrigatório' },
        len: { args: [2, 100], msg: 'O nome deve ter entre 2 e 100 caracteres' }
      }
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: { msg: 'Este email já está em uso' },
      validate: {
        isEmail: { msg: 'Email inválido' },
        notEmpty: { msg: 'O email é obrigatório' }
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'editor', 'gestor'),
      defaultValue: 'editor',
      allowNull: false
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      // Hash da senha antes de criar
      beforeCreate: async (user) => {
        if (user.password_hash) {
          user.password_hash = await bcrypt.hash(user.password_hash, 10);
        }
      },
      // Hash da senha antes de atualizar (se foi modificada)
      beforeUpdate: async (user) => {
        if (user.changed('password_hash')) {
          user.password_hash = await bcrypt.hash(user.password_hash, 10);
        }
      }
    }
  });

  // Método para verificar senha
  User.prototype.checkPassword = async function(password) {
    return bcrypt.compare(password, this.password_hash);
  };

  // Método para retornar dados públicos (sem senha)
  User.prototype.toPublicJSON = function() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      avatar: this.avatar,
      bio: this.bio,
      created_at: this.created_at
    };
  };

  return User;
};
