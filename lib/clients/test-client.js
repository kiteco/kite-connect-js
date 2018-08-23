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
    const rethrow = a => { throw a;};
    const promisify = gen => {
      try {
        return Promise.resolve(gen());
      } catch (err) {
        return Promise.reject(err);
      }
    };

    const invoke = (fn = pass, errFn = rethrow) => {
      if (invoked) {
        if (error) {
          return errFn ? promisify(() => errFn(error)) : Promise.reject(error);
        } else {
          return promisify(() => fn(results));
        }
      } else {
        invoked = true;
        try {
          results = router(opts, data);
          return promisify(() => fn(results));
        } catch (err) {
          error = err;
          return errFn ? promisify(() => errFn(error)) : Promise.reject(error);
        }
      }
    };

    return {
      then(fn, errFn) {
        return invoke(fn, errFn);
      },
      catch(errFn) {
        try {
          return invoke(undefined, errFn);
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
