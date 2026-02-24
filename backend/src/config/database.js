const { Sequelize } = require('sequelize');
const { env } = require('./env');
const { logger } = require('../shared/logger');

const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  logging: env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
  pool: {
    min: 2,
    max: 10,
    idle: 10000,
    acquire: 30000,
  },
  define: {
    underscored: true,
    timestamps: false,
  },
});

const connectDatabase = async () => {
  await sequelize.authenticate();
  logger.info('Database connection established');
};

const closeDatabase = async () => {
  await sequelize.close();
  logger.info('Database connection closed');
};

module.exports = { sequelize, connectDatabase, closeDatabase };
