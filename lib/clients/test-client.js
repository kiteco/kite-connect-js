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
    let invoked, error, results;

    const {router} = this;
    const pass = a => a;
    const invoke = (fn = pass, errFn = pass) => {
      if (invoked) {
        if (error) {
          return errFn(error);
        } else {
          return fn(results);
        }
      } else {
        invoked = true;
        try {
          results = router(opts, data);
          return fn(results);
        } catch (err) {
          error = err;
          if (errFn) {
            return errFn(err);
          }
        }
      }
    };

    return {
      then(fn, errFn) {
        invoke(fn, errFn);
        return this;
      },
      catch(errFn) {
        try {
          return Promise.resolve(invoke(undefined, errFn));
        } catch (err) {
          return Promise.reject(err);
        }
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
