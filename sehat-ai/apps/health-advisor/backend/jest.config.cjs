const path = require('path');
const host = path.resolve(__dirname, '../../../../emr-backend');
module.exports = {
  rootDir: __dirname,
  testMatch: ['<rootDir>/tests/**/*.spec.ts'],
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', path.join(host, 'node_modules')],
  transform: { '^.+\\.ts$': [path.join(host, 'node_modules/ts-jest'), {
    tsconfig: { ...require('./tsconfig.json').compilerOptions, types: ['jest', 'node'],
      typeRoots: [path.join(host, 'node_modules/@types')], declaration: false },
  }] },
};
