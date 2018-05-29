'use strict';

const {LEVELS} = require('./constants');
const NullReporter = require('./loggers/null');
const ConsoleReporter = require('./loggers/console');

module.exports =  {
  LEVELS,
  LEVEL: LEVELS.INFO,

  output: typeof console != 'undefined' ? ConsoleReporter : NullReporter,

  silly(...msgs) { this.log(LEVELS.SILLY, ...msgs); },
  verbose(...msgs) { this.log(LEVELS.VERBOSE, ...msgs); },
  debug(...msgs) { this.log(LEVELS.DEBUG, ...msgs); },
  info(...msgs) { this.log(LEVELS.INFO, ...msgs); },
  warn(...msgs) { this.log(LEVELS.WARNING, ...msgs); },
  error(...msgs) { this.log(LEVELS.ERROR, ...msgs); },
  log(level, ...msgs) {
    if (level >= this.LEVEL && !this.SILENT) {
      this.output.log(level, ...msgs);
    }
  },
  logRequest() {},
  logResponse() {},
};
