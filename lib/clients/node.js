'use strict';

const http = require('http');
const https = require('https');
const FormData = require('form-data');

const utils = require('../utils');

module.exports = class NodeClient {
  constructor(hostname, port, base = '', ssl = false) {
    this.hostname = hostname;
    this.port = port;
    this.base = base;
    this.protocol = ssl ? https : http;
    this.cookies = {};
  }

  request(opts, data, timeout) {
    return new Promise((resolve, reject) => {
      let form;

      opts.hostname = this.hostname;
      if (this.port > 0) { opts.port = this.port; }
      opts.path = this.base + opts.path;
      opts.headers = opts.headers || {};
      this.writeCookies(opts.headers);

      if (opts.headers['Content-Type'] === 'multipart/form-data' ||
          opts.headers['content-type'] === 'multipart/form-data') {
        delete opts.headers['Content-Type'];
        delete opts.headers['content-type'];

        form = new FormData();
        for (const key in data) {
          form.append(key, data[key]);
        }

        const headers = form.getHeaders();
        for (const key in headers) {
          opts.headers[key] = headers[key];
        }
      }

      const req = this.protocol.request(opts, resp => {
        this.readCookies(resp);
        resolve(resp);
      });
      req.on('error', err => reject(err));
      if (timeout != null) {
        req.setTimeout(timeout, () => reject(new Error('timeout')));
      }
      if (form) {
        form.pipe(req);
      } else {
        if (data) { req.write(data); }
        req.end();
      }
    });
  }

  readCookies(resp) {
    utils.parseSetCookies(resp.headers['set-cookie']).forEach(c => {
      this.cookies[c.Name] = c;
    });
  }

  writeCookies(hdrs) {
    const cookies = [];
    for (var k in this.cookies) {
      cookies.push(this.cookies[k]);
    }
    if (cookies.length) {
      hdrs.Cookies = utils.dumpCookies(cookies);
    }
  }
};
