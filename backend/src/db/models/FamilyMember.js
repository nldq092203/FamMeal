const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const FAMILY_ROLES = ['ADMIN', 'MEMBER'];

const FamilyMember = sequelize.define('FamilyMember', {
  familyId: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    field: 'family_id',
    references: { model: 'families', key: 'id' },
    onDelete: 'CASCADE',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    field: 'user_id',
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  role: {
    type: DataTypes.ENUM(...FAMILY_ROLES),
    allowNull: false,
    defaultValue: 'MEMBER',
  },
  joinedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'joined_at',
  },
}, {
  tableName: 'family_members',
  timestamps: false,
});

module.exports = { FamilyMember, FAMILY_ROLES };
