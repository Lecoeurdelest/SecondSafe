const fs = require('node:fs/promises');
const path = require('node:path');
const mongoose = require('mongoose');
require('dotenv').config();
const { EXPORT_FILES, summarizeExports } = require('./src/common/utils/demo-dashboard-data.util');

function demoDatabaseName(uri) {
  if (typeof uri !== 'string') return '';
  const match = /^mongodb(?:\+srv)?:\/\/[^/]+\/([^/?]+)/i.exec(uri);
  return match ? decodeURIComponent(match[1]) : '';
}

function validateDemoUri(uri) {
  if (!/(?:^|[_-])demo$/i.test(demoDatabaseName(uri))) {
    throw new Error('DEMO_MONGODB_URI must point to a database whose name ends with _demo or -demo');
  }
}

async function readExports(directory) {
  const exportsByName = {};
  for (const name of EXPORT_FILES) {
    const file = path.join(directory, `${name}.json`);
    const contents = await fs.readFile(file, 'utf8');
    exportsByName[name] = JSON.parse(contents.replace(/^\uFEFF/, ''));
  }
  return exportsByName;
}

async function importDemoDashboardData(directory) {
  const uri = process.env.DEMO_MONGODB_URI;
  validateDemoUri(uri);
  const exportsByName = await readExports(directory);
  const snapshot = summarizeExports(exportsByName);

  await mongoose.connect(uri);
  try {
    await mongoose.connection.collection('demo_dashboard_snapshot').replaceOne(
      { _id: 'latest' },
      snapshot,
      { upsert: true }
    );
    console.log(`Dashboard summary imported for ${Object.values(snapshot.sourceRecordCount).reduce((sum, count) => sum + count, 0)} records.`);
    console.log('Only aggregate statistics were stored; source documents and credential fields were not copied.');
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  const directory = process.argv[2];
  if (!directory) {
    console.error('Usage: npm run import:demo-data -- <path-to-secondsafe-data>');
    process.exitCode = 1;
  } else {
    importDemoDashboardData(directory).catch(error => {
      console.error(`Demo data import failed: ${error.message}`);
      process.exitCode = 1;
    });
  }
}

module.exports = { demoDatabaseName, validateDemoUri, readExports, importDemoDashboardData };
