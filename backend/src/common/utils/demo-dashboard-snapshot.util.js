const mongoose = require('mongoose');

async function loadDemoDashboardSnapshot() {
  const snapshot = await mongoose.connection.collection('demo_dashboard_snapshot').findOne({ _id: 'latest' });
  if (!snapshot) {
    throw Object.assign(new Error('Dữ liệu dashboard demo chưa được nạp'), {
      statusCode: 503,
      expose: true
    });
  }
  return snapshot;
}

module.exports = { loadDemoDashboardSnapshot };
