'use strict';

const sinon = require('sinon');
const {fakeResponse, fakeRouter} = require('../../test/helpers/http');

module.exports = class TestClient {
  constructor(routes = []) {
    this.routes = routes;
    this.router = fakeRouter(this.routes);
    this.appendRoute([
      o => true,
      o => fakeResponse(404),
    ]);

    sinon.spy(this, 'request');
  }

  request(opts, data, timeout) {
    let error;
    const {router} = this;

    return {
      then(fn, errFn) {
        try {
          fn(router(opts, data));
        } catch (err) {
          if (errFn) {
            errFn(err);
          } else {
            error = err;
          }
        }
        return this;
      },
      catch(errFn) {
        if (error) {
          errFn(error);
          return {
            then(fn) { fn(); },
          };
        }
        return this;
      },
      client: this,
    };
  }

  addRoute(route) {
    this.prependRoute(route);
  }

  prependRoute(route) {
    this.routes.unshift(route);
  }

  appendRoute(route) {
    this.routes.push(route);
  }
};
