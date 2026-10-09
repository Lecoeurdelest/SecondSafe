const LOG_LEVELS = Object.freeze({ error: 0, warn: 1, info: 2, debug: 3 });

function createLogger({ level = process.env.LOG_LEVEL || 'info', sink } = {}) {
  const threshold = LOG_LEVELS[String(level).toLowerCase()] ?? LOG_LEVELS.info;
  const write = sink || ((record) => {
    const stream = LOG_LEVELS[record.level] <= LOG_LEVELS.warn ? process.stderr : process.stdout;
    stream.write(`${JSON.stringify(record)}\n`);
  });
  return Object.fromEntries(Object.entries(LOG_LEVELS).map(([name, priority]) => [name, (message, ...details) => {
    if (priority > threshold) return;
    const context = details.map(value => value instanceof Error ? { name: value.name, message: value.message } : value);
    write({ timestamp: new Date().toISOString(), level: name, message, context });
  }]));
}

module.exports = { ...createLogger(), createLogger, LOG_LEVELS };
