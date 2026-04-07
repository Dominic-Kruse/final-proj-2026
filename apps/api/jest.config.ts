import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetModules: true,
  globalTeardown: "./src/utils/__tests__/teardown.ts",
  testPathIgnorePatterns: ["/node_modules/", "teardown.ts"], // ← add this
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

export default config;