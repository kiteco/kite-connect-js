'use strict';

module.exports = class KiteProcessError extends Error {
  constructor(type, data) {
    super(type);
    this.data = data;
    this.message = data.message;
    Error.captureStackTrace(this, this.constructor);
  }
};
