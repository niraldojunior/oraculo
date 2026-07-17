import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: [
    'src/application/services/**/*.ts',
    'src/domain/services/**/*.ts',
    'src/infrastructure/cache/cache.service.ts',
    'src/infrastructure/persistence/inmemory/**/*.ts',
    'src/infrastructure/persistence/oracle/OracleInitiativeRepository.ts',
    'src/infrastructure/persistence/oracle/oracle.service.ts',
    'src/infrastructure/persistence/prisma/PrismaInitiativeRepository.ts',
    'src/infrastructure/persistence/prisma/prisma.service.ts',
    'src/presentation/http/controllers/**/*.ts',
    '!src/presentation/http/controllers/health.controller.ts',
    '!src/presentation/http/controllers/azure.controller.ts',
    '!**/*.d.ts'
  ],
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.api.json',
        diagnostics: {
          ignoreCodes: [151002]
        }
      }
    ]
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 95,
      lines: 95,
      statements: 95
    }
  }
};

export default config;
