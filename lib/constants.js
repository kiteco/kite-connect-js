'use strict';

module.exports = {
  STATES: {
    UNSUPPORTED: 0,
    UNINSTALLED: 1,
    NOT_RUNNING: 2,
    UNREACHABLE: 3,
    UNLOGGED: 4,
    NOT_WHITELISTED: 5,

    // legacy states, prefer the ones above for health checks
    RUNNING: 3,
    REACHABLE: 4,
    AUTHENTICATED: 5,
  },
};
