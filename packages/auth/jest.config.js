module.exports = {
  ...require('@microapps/config/jest.base.js'),
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  maxWorkers: 1,
};
