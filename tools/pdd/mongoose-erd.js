const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..');
const backendDir = path.join(projectRoot, 'backend');
const mongoose = require(require.resolve('mongoose', { paths: [backendDir] }));
const modulesDir = path.join(backendDir, 'src', 'modules');

function escapeMermaid(value) {
  return String(value)
    .replace(/[^A-Za-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function escapeAttribute(value) {
  return String(value).replace(/[^A-Za-z0-9_.]/g, '_');
}

function sanitizeType(value) {
  return String(value).replace(/[^A-Za-z0-9_<>]/g, '_');
}

function getPathRef(schemaPath) {
  const options = schemaPath.options || {};
  return options.ref || (schemaPath.caster && schemaPath.caster.options && schemaPath.caster.options.ref);
}

function loadModels() {
  const models = [];

  for (const moduleName of fs.readdirSync(modulesDir).sort()) {
    const moduleDir = path.join(modulesDir, moduleName);
    if (!fs.statSync(moduleDir).isDirectory()) continue;

    for (const fileName of fs.readdirSync(moduleDir).sort()) {
      if (!fileName.endsWith('.model.js')) continue;
      const before = new Set(mongoose.modelNames());
      require(path.join(moduleDir, fileName));

      for (const modelName of mongoose.modelNames().filter((name) => !before.has(name))) {
        models.push(mongoose.model(modelName));
      }
    }
  }

  return models.sort((a, b) => a.modelName.localeCompare(b.modelName));
}

function generateMermaid(models) {
  const lines = ['```mermaid', 'erDiagram'];
  const relationships = [];
  const relationshipKeys = new Set();

  for (const model of models) {
    const entityName = escapeMermaid(model.modelName);
    lines.push(`  ${entityName} {`);

    model.schema.eachPath((fieldPath, schemaPath) => {
      if (fieldPath === '__v') return;

      let fieldType = schemaPath.instance;
      if (schemaPath.instance === 'Array' && schemaPath.caster) {
        fieldType = `Array_${schemaPath.caster.instance || 'Mixed'}`;
      }

      const flags = [];
      if (fieldPath === '_id') flags.push('PK');
      if (getPathRef(schemaPath)) flags.push('FK');

      const uniqueOptions = schemaPath.options && schemaPath.options.unique;
      if (uniqueOptions) flags.push('UK');
      if (schemaPath.options && schemaPath.options.required) flags.push('required');

      const suffix = flags.length ? ` ${flags.join(' ')}` : '';
      lines.push(`    ${sanitizeType(fieldType)} ${escapeAttribute(fieldPath)}${suffix}`);

      const ref = getPathRef(schemaPath);
      if (ref) {
        const isUnique = Boolean(uniqueOptions);
        const cardinality = isUnique ? '||--||' : '||--o{' ;
        const key = `${ref}:${model.modelName}:${fieldPath}`;
        if (!relationshipKeys.has(key)) {
          relationshipKeys.add(key);
          relationships.push(`  ${escapeMermaid(ref)} ${cardinality} ${entityName} : "${escapeAttribute(fieldPath)}"`);
        }
      }
    });

    lines.push('  }');
  }

  lines.push(...relationships.map((relationship) => relationship));
  lines.push('```');
  return lines.join('\n');
}

const models = loadModels();
process.stdout.write(generateMermaid(models));
