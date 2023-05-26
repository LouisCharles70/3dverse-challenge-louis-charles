import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '@app/file-system/(.*)': '<rootDir>/libs/file-system/src/$1',
    '@app/file-system': '<rootDir>/libs/file-system/src',
  },
  testTimeout: 30000,
};

export default config;
