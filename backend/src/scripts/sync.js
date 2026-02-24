require('dotenv').config();
const { sequelize } = require('../config/database');
require('../db/models'); // Load all models

async function syncDB() {
  try {
    console.log('Connecting to the database...');
    await sequelize.authenticate();
    console.log('Connection established.');

    console.log('Synchronizing models with the database...');
    
    const castQueries = [
      `ALTER TABLE users ALTER COLUMN avatar_id TYPE VARCHAR(255) USING avatar_id::text;`,
      `ALTER TABLE meals ALTER COLUMN meal_type TYPE VARCHAR(255) USING meal_type::text;`,
      `ALTER TABLE meals ALTER COLUMN status TYPE VARCHAR(255) USING status::text;`
    ];

    for (const query of castQueries) {
      try {
        await sequelize.query(query);
        console.log(`Pre-sync: Successfully executed cast query.`);
      } catch (e) {
        // Ignore errors (e.g., if the column is already a varchar or doesn't exist yet)
      }
    }

    // alter: true will update the existing tables to match models
    await sequelize.sync({ alter: true });
    
    console.log('Database sync complete. All tables are up to date.');
    process.exit(0);
  } catch (err) {
    console.error('Database sync failed:', err);
    process.exit(1);
  }
}

syncDB();
