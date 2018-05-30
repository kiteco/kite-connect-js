'use strict';

module.exports = class KiteError extends Error {
  constructor(type, data, content, resp) {
    super(type);
    this.name = this.constructor.name;
    this.message = [type, data, content].filter(e => e != null).join(' ');
    this.type = type;
    this.data = data;
    this.content = content;
    this.resp = resp;
    Error.captureStackTrace(this, this.constructor);
  }
};
