import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  testTimeout: 15000,
  clearMocks: true,
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  globalTeardown: "./src/__tests__/teardown.ts",
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "teardown.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

export default config;