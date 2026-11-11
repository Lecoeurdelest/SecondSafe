const { spawnSync } = require('child_process');
const path = require('path');

const backendRoot = path.resolve(__dirname, '..');
const loadConfig = "require('dotenv').config = () => ({}); require('./src/config/env')";

function runConfig(environment) {
  return spawnSync(process.execPath, ['-e', loadConfig], {
    cwd: backendRoot,
    env: environment,
    encoding: 'utf8'
  });
}

test('backend config starts without CHAT_ENCRYPTION_KEY so unrelated API routes remain available', () => {
  const environment = {
    ...process.env,
    MONGODB_URI: 'mongodb://127.0.0.1:27017/secondsafe-test',
    JWT_SECRET: 'config-test-secret'
  };
  delete environment.CHAT_ENCRYPTION_KEY;

  const result = runConfig(environment);

  expect(result.status).toBe(0);
});

test('backend config accepts a configured CHAT_ENCRYPTION_KEY', () => {
  const result = runConfig({
    ...process.env,
    MONGODB_URI: 'mongodb://127.0.0.1:27017/secondsafe-test',
    JWT_SECRET: 'config-test-secret',
    CHAT_ENCRYPTION_KEY: 'config-test-encryption-key'
  });

  expect(result.status).toBe(0);
});
