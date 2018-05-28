'use strict';

module.exports = {
  STATES: {
    UNSUPPORTED: 0,
    UNINSTALLED: 1,
    NOT_RUNNING: 2,
    UNREACHABLE: 3,
    UNLOGGED: 4,
    NOT_WHITELISTED: 5,
    WHITELISTED: 6,

    // legacy states, prefer the ones above for health checks
    INSTALLED: 2,
    RUNNING: 3,
    REACHABLE: 4,
    AUTHENTICATED: 5,
  },

  LEVELS: {
    SILLY: 0,
    VERBOSE: 1,
    DEBUG: 2,
    INFO: 3,
    WARNING: 4,
    ERROR: 5,
  },

};
