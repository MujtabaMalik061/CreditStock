export default {
  testEnvironment: "node",
  transform: {},
  roots: ["<rootDir>/tests"],
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.js"],
  testTimeout: 20000,
  verbose: true
};
