const logger = require('../common/utils/logger.util');

function startAllCronJobs() {
  logger.warn('Scheduled order lifecycle jobs are not enabled; implementation is pending TASK-046');
}

module.exports = { startAllCronJobs };
