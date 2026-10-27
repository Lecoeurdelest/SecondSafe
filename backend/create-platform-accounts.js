const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./src/modules/users/user.model');
const { assertStrongPassword } = require('./src/common/validators/password.validator');

const EMAIL_PATTERN = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;

function accountFromEnv(prefix, role, fullName) {
  const email = process.env[`${prefix}_EMAIL`]?.trim().toLowerCase();
  const password = process.env[`${prefix}_PASSWORD`];

  if (!email || !EMAIL_PATTERN.test(email) || !password) {
    throw new Error(
      `Set a valid ${prefix}_EMAIL and ${prefix}_PASSWORD in backend/.env`
    );
  }

  try {
    assertStrongPassword(password);
  } catch (error) {
    console.error(`${prefix} password validation failed`);
    console.error('Password length:', password.length);
    console.error(
      'Has uppercase:', /[A-Z]/.test(password)
    );
    console.error(
      'Has lowercase:', /[a-z]/.test(password)
    );
    console.error(
      'Has number:', /\d/.test(password)
    );
    console.error(
      'Has special character:', /[^A-Za-z0-9]/.test(password)
    );

    throw error;
  }

  return { email, password, role, fullName };
}

async function createMissingAccounts(accounts) {
  const existingUsers = await User.find({ email: { $in: accounts.map(account => account.email) } })
    .select('email role')
    .lean();
  const existingByEmail = new Map(existingUsers.map(user => [user.email, user]));

  for (const account of accounts) {
    const existing = existingByEmail.get(account.email);
    if (existing && existing.role !== account.role) {
      throw new Error(`Account ${account.email} already exists with role ${existing.role}; no role was changed`);
    }
  }

  for (const account of accounts) {
    if (existingByEmail.has(account.email)) {
      console.log(`Platform ${account.role} account already exists; credentials were not changed.`);
      continue;
    }
    await User.create({
      email: account.email,
      password: await bcrypt.hash(account.password, 12),
      fullName: account.fullName,
      role: account.role
    });
    console.log(`Platform ${account.role} account created.`);
  }
}

async function provisionPlatformAccounts() {
  if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI in backend/.env');
  const accounts = [
    accountFromEnv('PLATFORM_ADMIN', 'admin', 'SecondSafe Administrator'),
    accountFromEnv('PLATFORM_STAFF', 'moderator', 'SecondSafe Staff')
  ];
  if (accounts[0].email === accounts[1].email) throw new Error('Admin and staff accounts must use different emails');

  await mongoose.connect(process.env.MONGODB_URI);
  try {
    await createMissingAccounts(accounts);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  provisionPlatformAccounts().catch(error => {
    console.error(`Platform account setup failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { accountFromEnv, createMissingAccounts, provisionPlatformAccounts };
