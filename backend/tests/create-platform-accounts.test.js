jest.mock('../src/modules/users/user.model', () => ({
  find: jest.fn(),
  create: jest.fn()
}));

const User = require('../src/modules/users/user.model');
const bcrypt = require('bcryptjs');
const { accountFromEnv, createMissingAccounts } = require('../create-platform-accounts');

const accounts = [
  { email: 'admin@example.test', password: 'StrongAdmin1!', role: 'admin', fullName: 'Admin' },
  { email: 'staff@example.test', password: 'StrongStaff1!', role: 'moderator', fullName: 'Staff' }
];

beforeEach(() => {
  jest.clearAllMocks();
});

test('real platform account configuration normalizes the email and enforces a fresh strong password', () => {
  process.env.PLATFORM_ADMIN_EMAIL = 'ADMIN@example.test';
  process.env.PLATFORM_ADMIN_PASSWORD = 'StrongAdmin1!';

  expect(accountFromEnv('PLATFORM_ADMIN', 'admin', 'Admin')).toEqual(accounts[0]);
});

test('provisioning creates missing accounts without changing existing credentials', async () => {
  User.find.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([{ email: accounts[0].email, role: 'admin' }])
  });
  jest.spyOn(bcrypt, 'hash').mockResolvedValue('bcrypt-hash');

  await createMissingAccounts(accounts);

  expect(User.create).toHaveBeenCalledTimes(1);
  expect(User.create).toHaveBeenCalledWith({
    email: accounts[1].email,
    password: 'bcrypt-hash',
    fullName: 'Staff',
    role: 'moderator'
  });
  bcrypt.hash.mockRestore();
});

test('provisioning refuses to promote an existing account to admin or staff', async () => {
  User.find.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([{ email: accounts[0].email, role: 'user' }])
  });

  await expect(createMissingAccounts(accounts)).rejects.toThrow('no role was changed');
  expect(User.create).not.toHaveBeenCalled();
});
