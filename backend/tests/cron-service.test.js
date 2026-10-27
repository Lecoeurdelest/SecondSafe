const logger = require('../src/common/utils/logger.util');
const { startAllCronJobs } = require('../src/services/cron.service');

test('cron startup reports that scheduled jobs are not implemented yet', () => {
  const warning = jest.spyOn(logger, 'warn').mockImplementation(() => {});

  startAllCronJobs();

  expect(warning).toHaveBeenCalledWith(
    'Scheduled order lifecycle jobs are not enabled; implementation is pending TASK-046'
  );
});
