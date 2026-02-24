const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  familyId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'family_id',
    references: { model: 'families', key: 'id' },
    onDelete: 'CASCADE',
  },
  type: {
    type: DataTypes.SMALLINT,
    allowNull: false,
  },
  refId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'ref_id',
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_read',
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
}, {
  tableName: 'notifications',
  timestamps: false,
});

module.exports = { Notification };
