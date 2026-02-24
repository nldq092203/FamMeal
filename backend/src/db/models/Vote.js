const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Vote = sequelize.define('Vote', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  proposalId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'proposal_id',
    references: { model: 'proposals', key: 'id' },
    onDelete: 'CASCADE',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  rankPosition: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'rank_position',
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
}, {
  tableName: 'votes',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'proposal_id', 'rank_position'],
      name: 'votes_user_proposal_rank_unique',
    },
  ],
});

module.exports = { Vote };
