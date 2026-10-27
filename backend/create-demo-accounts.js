const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./src/modules/users/user.model');
const { validateStrongPassword } = require('./src/common/validators/password.validator');
const { validateDemoUri } = require('./import-demo-dashboard-data');

const EMAIL_PATTERN = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;

function accountFromEnv(prefix, role, fullName) {
  const email = process.env[`${prefix}_EMAIL`]?.trim().toLowerCase();
  const password = process.env[`${prefix}_PASSWORD`];
  if (!email || !EMAIL_PATTERN.test(email) || !password) {
    throw new Error(`Set a valid ${prefix}_EMAIL and ${prefix}_PASSWORD in backend/.env`);
  }
  validateStrongPassword(password);
  return { email, password, role, fullName };
}

async function createOrUpdateAccount(account) {
  const existing = await User.findOne({ email: account.email });
  if (existing && existing.role !== account.role) {
    throw new Error(`An account with the configured ${account.role} email already exists with another role`);
  }
  const password = await bcrypt.hash(account.password, 12);
  const profile = { email: account.email, password, fullName: account.fullName, role: account.role };
  if (existing) {
    Object.assign(existing, profile);
    await existing.save();
    return 'updated';
  }
  await User.create(profile);
  return 'created';
}

async function provisionDemoAccounts() {
  const uri = process.env.DEMO_MONGODB_URI;
  validateDemoUri(uri);
  const accounts = [
    accountFromEnv('DEMO_ADMIN', 'admin', 'SecondSafe Demo Admin'),
    accountFromEnv('DEMO_STAFF', 'moderator', 'SecondSafe Demo Staff')
  ];
  if (accounts[0].email === accounts[1].email) throw new Error('Admin and staff demo emails must be different');

  await mongoose.connect(uri);
  try {
    for (const account of accounts) {
      const result = await createOrUpdateAccount(account);
      console.log(`Demo ${account.role} account ${result}.`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  provisionDemoAccounts().catch(error => {
    console.error(`Demo account setup failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { accountFromEnv, createOrUpdateAccount, provisionDemoAccounts };
