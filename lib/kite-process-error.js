'use strict';

module.exports = class KiteProcessError extends Error {
  constructor(type, data) {
    super(type);
    this.data = data;
    this.message = `${type}: ${data.message}\ncmd: ${data.cmd}`;
    if (data.stdout) {
      this.message += `\nstdout: ${data.stdout}`;
    }
    if (data.stderr) {
      this.message += `\nstderr: ${data.stderr}`;
    }
    Error.captureStackTrace(this, this.constructor);
  }
};
