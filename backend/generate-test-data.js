const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const MODEL_FILES = [
  'users/user.model.js',
  'products/category.model.js',
  'products/product.model.js',
  'users/cart-item.model.js',
  'users/favorite.model.js',
  'orders/purchase-request.model.js',
  'orders/order.model.js',
  'payments/wallet.model.js',
  'payments/transaction.model.js',
  'payments/escrow-hold.model.js',
  'delivery/delivery.model.js',
  'chat/conversation.model.js',
  'chat/message.model.js',
  'support/support-conversation.model.js',
  'support/support-message.model.js',
  'notifications/notification.model.js',
  'reports/report.model.js',
  'reports/dispute.model.js',
  'reports/review.model.js'
];

const DOCUMENT_COUNT = 10;
const TEST_PASSWORD_HASH = bcrypt.hashSync('Test@123456', 12);
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const force = args.has('--force');

function setPath(target, path, value) {
  const parts = path.split('.');
  let current = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    if (!current[parts[index]] || typeof current[parts[index]] !== 'object') current[parts[index]] = {};
    current = current[parts[index]];
  }
  current[parts[parts.length - 1]] = value;
}

function uniqueString(path, index, modelName) {
  const key = path.toLowerCase();
  const prefix = modelName.toLowerCase();
  if (key.includes('email')) return `test.user.${index + 1}@example.com`;
  if (key.includes('slug')) return `${prefix}-${index + 1}`;
  if (key.includes('code') || key.endsWith('code')) return `${prefix.slice(0, 3).toUpperCase()}TEST${String(index + 1).padStart(3, '0')}`;
  return `${prefix}_${path}_${index + 1}`;
}

function sampleString(path, index, modelName, enumValues) {
  if (enumValues && enumValues.length) return enumValues[index % enumValues.length];
  const key = path.toLowerNameCase?.() || path.toLowerCase();
  if (key.includes('email')) return `test.${modelName.toLowerCase()}.${index + 1}@example.com`;
  if (key.includes('password')) return '$2b$12$test-only-placeholder-value';
  if (key.includes('phone')) return `090${String(index + 1).padStart(7, '0')}`;
  if (key.includes('address') && !key.endsWith('address')) return `${index + 1} Test Street`;
  if (key.includes('city')) return 'Ho Chi Minh City';
  if (key.includes('district')) return `District ${index + 1}`;
  if (key.includes('ward')) return `Ward ${index + 1}`;
  if (key.includes('name')) return `Test ${modelName} ${index + 1}`;
  if (key.includes('title')) return `Test product ${index + 1}`;
  if (key.includes('description') || key.includes('message') || key.includes('reason') || key.includes('notes')) return `Test data for ${modelName} record ${index + 1}`;
  if (key.includes('url') || key.includes('image') || key.includes('avatar')) return `/uploads/test/${modelName}-${index + 1}.jpg`;
  return `TEST_${modelName}_${path}_${index + 1}`.replace(/[^A-Za-z0-9_./@-]/g, '_');
}

function sampleValue(schemaPath, path, index, modelName, generated) {
  const options = schemaPath.options || {};
  const instance = schemaPath.instance;
  const ref = options.ref || (schemaPath.caster && schemaPath.caster.options && schemaPath.caster.options.ref);

  if (ref) {
    const records = generated[ref];
    if (records && records.length) return records[index % records.length]._id;
    return new mongoose.Types.ObjectId();
  }
  if (instance === 'String') return options.unique ? uniqueString(path, index, modelName) : sampleString(path, index, modelName, schemaPath.enumValues);
  if (instance === 'Number') {
    const minimum = typeof options.min === 'number' ? options.min : 0;
    const maximum = typeof options.max === 'number' ? options.max : null;
    if (maximum !== null) {
      const span = maximum - minimum + 1;
      return minimum + ((index % span) + 0);
    }
    return (index + 1) * 1000;
  }
  if (instance === 'Boolean') return index % 2 === 0;
  if (instance === 'Date') return new Date(Date.now() + index * 60_000);
  if (instance === 'Array') {
    if (schemaPath.caster && schemaPath.caster.instance === 'ObjectId') {
      const refName = schemaPath.caster.options && schemaPath.caster.options.ref;
      const records = refName && generated[refName];
      return records && records.length ? [records[index % records.length]._id] : [new mongoose.Types.ObjectId()];
    }
    if (schemaPath.caster && schemaPath.caster.instance === 'String') return [`/uploads/test/${modelName}-${index + 1}.jpg`];
    return [index % 2 === 0 ? { value: index + 1 } : { value: `item-${index + 1}` }];
  }
  if (instance === 'Mixed') return { seed: true, index: index + 1 };
  return null;
}

function shouldFillField(model, schemaPath, path) {
  const options = schemaPath.options || {};
  if (options.required || schemaPath.isRequired) return true;
  if (model.modelName === 'Product' && path === 'images') return true;
  if (schemaPath.instance === 'ObjectId') return true;

  const indexes = model.schema.indexes();
  for (const [key, indexOptions] of indexes) {
    if (indexOptions.unique && Object.prototype.hasOwnProperty.call(key, path)) return true;
  }
  return false;
}

function generateDocuments(model, generated) {
  const documents = [];
  const password = TEST_PASSWORD_HASH;

  for (let index = 0; index < DOCUMENT_COUNT; index += 1) {
    const document = {};

    model.schema.eachPath((path, schemaPath) => {
      if (path === '_id' || path === '__v' || path.startsWith('_')) return;
      if (!shouldFillField(model, schemaPath, path)) return;

      let value = sampleValue(schemaPath, path, index, model.modelName, generated);
      if (model.modelName === 'User' && path === 'password') value = password;
      if (model.modelName === 'Product' && path === 'images') value = [`/uploads/products/test-${index + 1}.jpg`];
      if (model.modelName === 'Category' && path === 'name') value = `Test Category ${index + 1}`;
      if (model.modelName === 'Category' && path === 'slug') value = `test-category-${index + 1}`;
      if (model.modelName === 'Order' && path === 'orderCode') value = `ODTEST${String(index + 1).padStart(6, '0')}`;
      setPath(document, path, value);
    });

    documents.push(document);
  }

  return documents;
}

function getDependencies(model, modelsByName) {
  const dependencies = new Set();
  model.schema.eachPath((path, schemaPath) => {
    if (schemaPath.instance === 'ObjectId') {
      const options = schemaPath.options || {};
      if (options.ref && modelsByName.has(options.ref)) dependencies.add(options.ref);
    }
    if (schemaPath.instance === 'Array' && schemaPath.caster && schemaPath.caster.options && schemaPath.caster.options.ref) {
      const ref = schemaPath.caster.options.ref;
      if (modelsByName.has(ref)) dependencies.add(ref);
    }
  });
  return [...dependencies];
}

function orderModels(models) {
  const remaining = [...models];
  const ordered = [];
  const modelsByName = new Map(models.map((model) => [model.modelName, model]));

  while (remaining.length) {
    const ready = remaining.filter((model) => getDependencies(model, modelsByName).every((dependency) => ordered.some((item) => item.modelName === dependency)));
    if (!ready.length) {
      ordered.push(...remaining);
      break;
    }
    for (const model of ready) ordered.push(model);
    const readyNames = new Set(ready.map((model) => model.modelName));
    for (let index = remaining.length - 1; index >= 0; index -= 1) {
      if (readyNames.has(remaining[index].modelName)) remaining.splice(index, 1);
    }
  }
  return ordered;
}

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  const models = [];
  for (const relativePath of MODEL_FILES) {
    const model = require(require('path').join(__dirname, 'src/modules', relativePath));
    if (model && model.modelName) models.push(model);
  }

  const orderedModels = orderModels(models);
  const generated = {};

  if (dryRun) {
    for (const model of orderedModels) {
      const documents = generateDocuments(model, generated);
      const validationErrors = documents.flatMap((document) => {
        const error = new model(document).validateSync();
        return error ? [error] : [];
      });
      if (validationErrors.length) {
        throw new Error(`${model.modelName}: ${validationErrors.map((error) => error.message).join('; ')}`);
      }
      generated[model.modelName] = documents.map((document) => ({ _id: new mongoose.Types.ObjectId(), ...document }));
      console.log(`${model.collection.collectionName}: ${documents.length} documents generated and validated`);
    }
    console.log('Dry run completed; MongoDB was not modified.');
    return;
  }

  if (!mongoUri) throw new Error('MONGODB_URI is required');
  if (!force) throw new Error('This script deletes existing collections. Re-run with --force to confirm.');

  await mongoose.connect(mongoUri);
  try {
    for (const model of orderedModels) {
      await model.deleteMany({});
      const documents = generateDocuments(model, generated);
      const inserted = await model.insertMany(documents, { ordered: true });
      generated[model.modelName] = inserted;
      console.log(`✓ ${model.collection.collectionName}: inserted ${inserted.length} documents`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(`Test data generation failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { generateDocuments, main };
