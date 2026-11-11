const { accountFromEnv } = require('../create-demo-accounts');

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

test('demo account setup accepts role credentials from the environment', () => {
  process.env.DEMO_ADMIN_EMAIL = 'ADMIN@example.test';
  process.env.DEMO_ADMIN_PASSWORD = 'StrongAdmin1!';

  expect(accountFromEnv('DEMO_ADMIN', 'admin', 'Demo Admin')).toEqual({
    email: 'admin@example.test',
    password: 'StrongAdmin1!',
    role: 'admin',
    fullName: 'Demo Admin'
  });
});

test('demo account setup rejects a password that fails the shared strong policy', () => {
  process.env.DEMO_STAFF_EMAIL = 'staff@example.test';
  process.env.DEMO_STAFF_PASSWORD = 'WeakStaff123';

  expect(() => accountFromEnv('DEMO_STAFF', 'moderator', 'Demo Staff'))
    .toThrow('Mật khẩu phải có ít nhất 8 ký tự');
});
