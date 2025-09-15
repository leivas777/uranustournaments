// jest.config.js (para backend)
module.exports = {
  testEnvironment: 'node', // CORREÇÃO: Backend deve usar 'node', não 'jsdom'
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'services/**/*.js',
    'controllers/**/*.js',
    'routes/**/*.js',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js'
  ],
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};