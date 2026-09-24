const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./src/modules/users/user.model');

const REQUIRED_ENV = ['MONGODB_URI', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

async function createAdmin() {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(`Missing environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  if (!STRONG_PASSWORD.test(process.env.ADMIN_PASSWORD)) {
    console.error('ADMIN_PASSWORD must have at least 8 characters with upper case, lower case, digit and special character.');
    process.exit(1);
  }

  const email = process.env.ADMIN_EMAIL.toLowerCase();
  let exitCode = 0;
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    if (await User.exists({ email })) {
      console.log(`Admin account ${email} already exists`);
      return;
    }

    await User.create({
      email,
      password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
      fullName: process.env.ADMIN_FULL_NAME || 'System Administrator',
      phone: process.env.ADMIN_PHONE || undefined,
      role: 'admin'
    });
    console.log(`Admin account ${email} created`);
  } catch (error) {
    console.error('Error creating admin:', error.message);
    exitCode = 1;
  } finally {
    await mongoose.disconnect();
    process.exit(exitCode);
  }
}

createAdmin();
