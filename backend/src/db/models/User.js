const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const AVATAR_IDS = [
  'panda', 'raccoon', 'cat', 'dog', 'rabbit', 'bear',
  'elephant', 'fox', 'giraffe', 'koala', 'penguin', 'frog', 'monkey',
];

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  avatarId: {
    type: DataTypes.ENUM(...AVATAR_IDS),
    allowNull: false,
    defaultValue: 'panda',
    field: 'avatar_id',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at',
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_at',
  },
}, {
  tableName: 'users',
  timestamps: false,
});

module.exports = { User, AVATAR_IDS };
