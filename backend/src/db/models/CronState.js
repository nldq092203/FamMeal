const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const CronState = sequelize.define('CronState', {
  jobName: {
    type: DataTypes.TEXT,
    primaryKey: true,
    field: 'job_name',
  },
  lastRunAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'last_run_at',
  },
}, {
  tableName: 'cron_state',
  timestamps: false,
});

module.exports = { CronState };
