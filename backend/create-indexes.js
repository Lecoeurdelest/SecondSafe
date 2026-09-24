const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const MODULES_DIR = path.join(__dirname, 'src', 'modules');

function loadModels() {
  for (const moduleName of fs.readdirSync(MODULES_DIR)) {
    const moduleDir = path.join(MODULES_DIR, moduleName);
    for (const file of fs.readdirSync(moduleDir)) {
      if (file.endsWith('.model.js')) {
        require(path.join(moduleDir, file));
      }
    }
  }
  return mongoose.modelNames().sort().map((name) => mongoose.model(name));
}

async function createIndexes() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Missing environment variable: MONGODB_URI');
  }
  const models = loadModels();
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    for (const model of models) {
      await model.createIndexes();
      const indexes = await model.collection.getIndexes();
      console.log(`${model.modelName}:`);
      for (const [name, key] of Object.entries(indexes)) {
        console.log(`  - ${name}: ${JSON.stringify(key)}`);
      }
    }
    console.log(`\n✓ Indexes created for ${models.length} models`);
  } finally {
    await mongoose.connection.close();
  }
}

createIndexes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error creating indexes:', error.message);
    process.exit(1);
  });
