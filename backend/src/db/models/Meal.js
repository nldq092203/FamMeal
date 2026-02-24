const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const MEAL_STATUSES = ['PLANNING', 'LOCKED', 'COMPLETED'];
const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'BRUNCH', 'OTHER'];

const Meal = sequelize.define('Meal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  familyId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'family_id',
    references: { model: 'families', key: 'id' },
    onDelete: 'CASCADE',
  },
  scheduledFor: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'scheduled_for',
  },
  mealType: {
    type: DataTypes.ENUM(...MEAL_TYPES),
    allowNull: false,
    defaultValue: 'DINNER',
    field: 'meal_type',
  },
  status: {
    type: DataTypes.ENUM(...MEAL_STATUSES),
    allowNull: false,
    defaultValue: 'PLANNING',
  },
  constraints: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  finalDecision: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'final_decision',
  },
  cookUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'cook_user_id',
    references: { model: 'users', key: 'id' },
    onDelete: 'SET NULL',
  },
  votingClosedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'voting_closed_at',
  },
  finalizedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'finalized_at',
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
  tableName: 'meals',
  timestamps: false,
});

module.exports = { Meal, MEAL_STATUSES, MEAL_TYPES };
