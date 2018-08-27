'use strict';

module.exports = class KiteStateError extends Error {
  get type() { return 'bad_state'; }
  
  constructor(message, data) {
    super(message);
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
};
