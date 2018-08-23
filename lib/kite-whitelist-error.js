'use strict';

module.exports = class KiteWhitelistError extends Error {
  get type() { return 'bad_whitelist_state'; }

  constructor(message, data) {
    super(message);
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
};
