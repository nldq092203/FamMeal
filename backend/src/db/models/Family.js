const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const { AVATAR_IDS } = require('./User');

const Family = sequelize.define('Family', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
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
  settings: {
    type: DataTypes.JSONB,
    allowNull: true,
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
  tableName: 'families',
  timestamps: false,
});

module.exports = { Family };
