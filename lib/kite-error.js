'use strict';

module.exports = class KiteError extends Error {
  constructor(type, data, content) {
    super(type);
    this.name = this.constructor.name;
    this.message = [type, data, content].filter(e => e != null).join(' ');
    this.type = type;
    this.data = data;
    this.content = content;
    Error.captureStackTrace(this, this.constructor);
  }
};
