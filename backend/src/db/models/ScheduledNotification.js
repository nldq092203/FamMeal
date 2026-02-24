const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const ScheduledNotification = sequelize.define('ScheduledNotification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  type: {
    type: DataTypes.SMALLINT,
    allowNull: false,
  },
  familyId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'family_id',
    references: { model: 'families', key: 'id' },
    onDelete: 'CASCADE',
  },
  refId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'ref_id',
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'scheduled_at',
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'PENDING',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
}, {
  tableName: 'scheduled_notifications',
  timestamps: false,
});

module.exports = { ScheduledNotification };
