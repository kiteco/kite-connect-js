'use strict';

const expect = require('expect.js');
const TestClient = require('../../lib/clients/test-client');
const {fakeResponse} = require('../helpers/http');
const {waitsForPromise} = require('../helpers/async');

require('../helpers/expect');

describe('TestClient', () => {
  let client;

  beforeEach(() => {
    client = new TestClient();
  });

  it('has a default route that responds with 404 for any requests', () => {
    expect(client.request({path: '/foo'})).to.respondWithStatus(404);
  });

  it('returns a promise-like object that has proper resolve continuation', () => {
    return waitsForPromise(() => client.request({path: '/foo'})
      .then(resp => {
        expect(resp).not.to.be(null);
        return resp;
      })
      .then(resp => {
        expect(resp).not.to.be(null);
        return resp;
      }));
  });

  it('returns a promise-like object that has proper catch continuation', () => {
    return waitsForPromise(() => client.request({path: '/foo'})
      .then(resp => {
        throw new Error('foo');
      })
      .catch(err => {
        return err.message;
      })
      .then(msg => {
        expect(msg).to.eql('foo');
      }));
  });
  it('returns a promise-like object that has proper catch throwing continuation', () => {

    return waitsForPromise(() => client.request({path: '/foo'})
      .then(resp => {
        throw new Error('foo');
      })
      .catch(err => {
        throw new Error('bar');
      })
      .catch(err => {
        expect(err.message).to.eql('bar');
      }));
  });

  it('returns a promise-like object that has proper error continuation', () => {
    return waitsForPromise(() => client.request({path: '/foo'})
      .then(resp => {
        throw new Error('foo');
      })
      .then(() => {}, err => {
        return err.message;
      })
      .then(msg => {
        expect(msg).to.eql('foo');
      }));
  });

  it('returns a promise-like object that has proper error throwing continuation', () => {
    return waitsForPromise(() => client.request({path: '/foo'})
      .then(resp => {
        throw new Error('foo');
      })
      .then(resp => {}, err => {
        throw new Error('bar');
      })
      .catch(err => {
        expect(err.message).to.eql('bar');
      }));
  });

  describe('adding a route', () => {
    beforeEach(() => {
      client.addRoute([
        o => o.path === '/foo',
        o => fakeResponse(200, 'some response data'),
      ]);
    });

    it('processes requests using that route before the 404 fallback', () => {
      expect(client.request({path: '/foo'})).to.respondWithStatus(200);
      expect(client.request({path: '/foo'})).to.respondWith('some response data');

      expect(client.request({path: '/bar'})).to.respondWithStatus(404);
    });

    describe('that throws an error', () => {
      beforeEach(() => {
        client.addRoute([
          o => true,
          o => { throw new Error(); },
        ]);
      });

      it('treats that as a connection error', () => {
        return waitsForPromise({shouldReject: true}, () => client.request({path: '/foo'}));
      });
    });
  });
});
