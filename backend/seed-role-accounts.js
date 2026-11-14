const crypto = require('node:crypto');
const path = require('node:path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./src/modules/users/user.model');
const Category = require('./src/modules/products/category.model');
const Product = require('./src/modules/products/product.model');
const { categories } = require('./src/seeds/categories.seed');
const { productsData } = require('./src/seeds/products.seed');
const { validateStrongPassword } = require('./src/common/validators/password.validator');

const apply = process.argv.includes('--apply');

const ACCOUNTS = [
  { key: 'admin', email: 'demo.admin@example.com', fullName: 'Demo Admin', role: 'admin', phone: '0900000001' },
  { key: 'moderator', email: 'demo.staff@example.com', fullName: 'Demo Moderator', role: 'moderator', phone: '0900000002' },
  { key: 'buyer', email: 'demo.buyer@example.com', fullName: 'Demo Buyer', role: 'user', phone: '0900000003' },
  { key: 'seller', email: 'demo.seller@example.com', fullName: 'Demo Seller', role: 'user', phone: '0900000004' }
];

function generatePassword() {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '@#%!*'];
  const all = sets.join('');
  const chars = sets.map((set) => set[crypto.randomInt(set.length)]);
  while (chars.length < 16) chars.push(all[crypto.randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

function describeTarget(uri) {
  const match = /^mongodb(?:\+srv)?:\/\/(?:[^@/]+@)?([^/?]+)\/?([^?]*)/i.exec(uri || '');
  return match ? { host: match[1], database: decodeURIComponent(match[2]) || '(default)' } : { host: '?', database: '?' };
}

function buildProduct(item, categoryBySlug, sellerId) {
  const { categorySlug, ...rest } = item;
  return {
    ...rest,
    category: categoryBySlug.get(categorySlug),
    seller: sellerId,
    views: Math.floor(Math.random() * 500),
    images: [`/images/products/${categorySlug}.${categorySlug === 'toys' ? 'svg' : 'jpg'}`]
  };
}

function dryRun() {
  const fakeId = new mongoose.Types.ObjectId();
  const errors = [];
  for (const account of ACCOUNTS) {
    const password = process.env.ROLE_ACCOUNTS_PASSWORD || generatePassword();
    const check = validateStrongPassword(password);
    if (!check.valid) errors.push(`${account.email}: ${check.message}`);
    const error = new User({ ...account, password: 'x'.repeat(60) }).validateSync();
    if (error) errors.push(`${account.email}: ${error.message}`);
  }
  const categoryBySlug = new Map(categories.map((category) => [category.slug, new mongoose.Types.ObjectId()]));
  for (const category of categories) {
    const error = new Category(category).validateSync();
    if (error) errors.push(`category ${category.slug}: ${error.message}`);
  }
  for (const item of productsData) {
    const error = new Product(buildProduct(item, categoryBySlug, fakeId)).validateSync();
    if (error) errors.push(`product ${item.title}: ${error.message}`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`Validated ${ACCOUNTS.length} accounts, ${categories.length} categories, ${productsData.length} products.`);
}

async function run() {
  dryRun();
  const target = describeTarget(process.env.MONGODB_URI);
  console.log(`Target: ${target.host} / ${target.database}`);
  if (!apply) {
    console.log('Dry run only. Nothing was written. Re-run with --apply to write.');
    return;
  }
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  const created = [];
  try {
    const users = {};
    for (const account of ACCOUNTS) {
      const existing = await User.findOne({ email: account.email });
      if (existing) {
        if (existing.role !== account.role) {
          throw new Error(`${account.email} already exists with role ${existing.role}; nothing was changed`);
        }
        users[account.key] = existing;
        console.log(`= ${account.email} (${account.role}) already exists, password unchanged`);
        continue;
      }
      const password = process.env.ROLE_ACCOUNTS_PASSWORD || generatePassword();
      const check = validateStrongPassword(password);
      if (!check.valid) throw new Error(check.message);
      const { key, ...profile } = account;
      users[key] = await User.create({ ...profile, password: await bcrypt.hash(password, 12) });
      created.push({ role: account.role, email: account.email, password });
      console.log(`+ ${account.email} (${account.role}) created`);
    }

    if ((await Category.countDocuments()) === 0) {
      await Category.insertMany(categories);
      console.log(`+ ${categories.length} categories inserted`);
    } else {
      console.log('= categories already exist, skipped');
    }

    if ((await Product.countDocuments()) === 0) {
      const stored = await Category.find({}).lean();
      const categoryBySlug = new Map(stored.map((category) => [category.slug, category._id]));
      const documents = productsData
        .filter((item) => categoryBySlug.has(item.categorySlug))
        .map((item) => buildProduct(item, categoryBySlug, users.seller._id));
      await Product.insertMany(documents);
      console.log(`+ ${documents.length} products inserted (seller ${users.seller.email})`);
    } else {
      console.log('= products already exist, skipped');
    }
  } finally {
    await mongoose.disconnect();
  }

  if (created.length) {
    console.log('\nNewly created logins (shown once, save them now):');
    console.table(created);
  }
}

run().catch((error) => {
  console.error(`Seed failed: ${error.message}`);
  process.exitCode = 1;
});
