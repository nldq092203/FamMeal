import dotenv from 'dotenv';
import path from 'path';

// Load .env file for tests
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Ensure NODE_ENV is set to test
process.env.NODE_ENV = 'test';
