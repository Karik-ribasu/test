module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
  setupFiles: ['<rootDir>/jest.setup.ts'],
};