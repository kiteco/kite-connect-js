'use strict';

module.exports = class KiteRequestError extends Error {
  get type() { return 'bad_status'; }

  constructor(message, data) {
    super(message);
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
};
