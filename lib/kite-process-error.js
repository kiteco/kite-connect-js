'use strict';

module.exports = class KiteProcessError extends Error {
  constructor(type, data) {
    super(type);
    this.data = data;
    this.message = `${data.message}\ncmd: ${data.cmd}\nstdout: ${data.stdout}\nstderr: ${data.stderr}`;
    Error.captureStackTrace(this, this.constructor);
  }
};
