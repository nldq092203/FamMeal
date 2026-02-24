module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/__tests__/**/*.test.js'],
  globalSetup: './src/__tests__/globalSetup.js',
  globalTeardown: './src/__tests__/globalTeardown.js',
  testTimeout: 15000,
  verbose: true,
};
