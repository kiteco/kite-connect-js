'use strict';

const {LEVELS} = require('../constants');

module.exports = {
  TRACE_ALL: false,
  METHODS: {
    [LEVELS.SILLY]: 'debug' in console ? 'debug' : 'log',
    [LEVELS.VERBOSE]: 'debug' in console ? 'debug' : 'log',
    [LEVELS.DEBUG]: 'log',
    [LEVELS.INFO]: 'info' in console ? 'info' : 'log',
    [LEVELS.WARN]: 'warn' in console ? 'warn' : 'error',
    [LEVELS.ERROR]: 'error',
  },

  log(level, ...msgs) {
    console[this.METHODS[level]](...msgs);
  },
};
