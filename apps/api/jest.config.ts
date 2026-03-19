import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  forceExit: true, // Useful for closing NeonDB connections
  clearMocks: true,
  resetModules: true,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1", // If you use path aliases
  },
};

export default config;