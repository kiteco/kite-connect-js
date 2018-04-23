const expect = require('expect.js');
const {inspect} = require('util');
const {Assertion} = expect;

Assertion.prototype.respondWithStatus = function(status) {
  this.obj.then((resp) => {
    const {method, path} = this.obj.client.request.lastCall.args[0];

    this.assert(
      expect.eql(resp.statusCode, status),
      () => `expected ${method} ${path} request to respond with ${status} but was ${resp.statusCode}`,
      () => `expected ${method} ${path} request to not respond with ${status} and was ${resp.statusCode}`,
      status);
  });
  return this;
};
Assertion.prototype.respondWith = function(data) {
  this.obj.then((resp) => {
    const {method, path} = this.obj.client.request.lastCall.args[0];

    this.assert(
      expect.eql(resp.data, data),
      () => `expected ${method} ${path} request to respond with ${inspect(data)} but was ${inspect(resp.data)}`,
      () => `expected ${method} ${path} request to not respond with ${inspect(data)} and was ${inspect(resp.data)}`,
      data);
  });
  return this;
};
