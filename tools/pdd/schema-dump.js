const fs = require('fs');
const path = require('path');

const backendDir = path.resolve(__dirname, '..', '..', 'backend');
const mongoose = require(require.resolve('mongoose', { paths: [backendDir] }));
const modulesDir = path.join(backendDir, 'src', 'modules');

const files = [];
for (const moduleName of fs.readdirSync(modulesDir).sort()) {
  for (const file of fs.readdirSync(path.join(modulesDir, moduleName)).sort()) {
    if (file.endsWith('.model.js')) {
      const relative = path.posix.join('backend/src/modules', moduleName, file);
      const before = new Set(mongoose.modelNames());
      require(path.join(modulesDir, moduleName, file));
      mongoose.modelNames().filter((name) => !before.has(name)).forEach((name) => files.push([name, relative]));
    }
  }
}

function describePath(schemaPath) {
  const options = schemaPath.options || {};
  const item = { path: schemaPath.path, type: schemaPath.instance };
  if (schemaPath.instance === 'Array' && schemaPath.caster) {
    item.type = `Array<${schemaPath.caster.instance || 'Mixed'}>`;
  }
  if (options.required || schemaPath.isRequired) item.required = true;
  if (schemaPath.enumValues && schemaPath.enumValues.length) item.enum = schemaPath.enumValues;
  const ref = options.ref || (schemaPath.caster && schemaPath.caster.options && schemaPath.caster.options.ref);
  if (ref) item.ref = ref;
  if (options.default !== undefined && typeof options.default !== 'function') item.default = options.default;
  for (const key of ['min', 'max', 'minlength', 'maxlength', 'unique']) {
    const value = options[key];
    if (value !== undefined) item[key] = Array.isArray(value) ? value[0] : value;
  }
  return item;
}

const models = files.map(([name, file]) => {
  const model = mongoose.model(name);
  const paths = [];
  model.schema.eachPath((p, schemaPath) => {
    if (p === '__v') return;
    paths.push(describePath(schemaPath));
  });
  return {
    name,
    collection: model.collection.collectionName,
    file,
    fields: paths,
    indexes: model.schema.indexes().map(([key, options]) => ({ key, options: options || {} }))
  };
});

process.stdout.write(JSON.stringify(models, null, 2) + '\n');
