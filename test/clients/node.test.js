'use strict';

const http = require('http');
const https = require('https');
const sinon = require('sinon');
const expect = require('expect.js');
const NodeClient = require('../../lib/clients/node');
const {fakeRequestMethod} = require('../helpers/http');
const {waitsForPromise} = require('../helpers/async');

describe('NodeClient', () => {
  let client, hostname, port, base, promise, requestStub;

  beforeEach(() => {
    hostname = 'localhost';
    port = 1234;
    base = 'base';
    client = new NodeClient(hostname, port, base);
  });

  describe('.request()', () => {
    describe('when ssl protocol is enabled', () => {
      beforeEach(() => {
        client.protocol = https;
      });

      describe('and the request succeeds', () => {
        beforeEach(() => {
          requestStub = sinon.stub(https, 'request').callsFake(fakeRequestMethod(true));
          promise = client.request({path: '/foo'});
        });

        afterEach(() => {
          requestStub.restore();
        });

        it('returns a promise that will be resolved once completed', () => {
          return promise.then(() => {
            expect(https.request.called).to.be.ok();
          });
        });
      });

      describe('and the request fails', () => {
        beforeEach(() => {
          requestStub = sinon.stub(https, 'request').callsFake(fakeRequestMethod(false));
          promise = client.request({path: '/foo'});
        });

        afterEach(() => {
          requestStub.restore();
        });

        it('returns a promise that will be rejected', () => {
          return waitsForPromise({shouldReject: true}, () => promise);
        });
      });

      describe('and the request timeout', () => {
        beforeEach(() => {
          requestStub = sinon.stub(https, 'request').callsFake(fakeRequestMethod());
          promise = client.request({path: '/foo'}, '', 1000);
        });

        afterEach(() => {
          requestStub.restore();
        });

        it('returns a promise that will be rejected', () => {
          return waitsForPromise({shouldReject: true}, () => promise);
        });
      });
    });

    describe('when ssl protocol is disabled', () => {
      describe('and the request succeeds', () => {
        beforeEach(() => {
          requestStub = sinon.stub(http, 'request').callsFake(fakeRequestMethod(true));
          promise = client.request({path: '/foo'});
        });

        afterEach(() => {
          requestStub.restore();
        });

        it('returns a promise that will be resolved once completed', () => {
          return promise.then(() => {
            expect(http.request.called).to.be.ok();
          });
        });
      });

      describe('and the request fails', () => {
        beforeEach(() => {
          requestStub = sinon.stub(http, 'request').callsFake(fakeRequestMethod(false));
          promise = client.request({path: '/foo'});
        });

        afterEach(() => {
          requestStub.restore();
        });

        it('returns a promise that will be rejected', () => {
          return waitsForPromise({shouldReject: true}, () => promise);
        });
      });
    });

    describe('when the response contains a set-cookie header', () => {
      beforeEach(() => {
        requestStub = sinon.stub(http, 'request').callsFake(fakeRequestMethod({
          headers: {
            'set-cookie': ['foo=bar', 'baz=foo'],
          },
        }));
        promise = client.request({path: '/foo'});
      });

      afterEach(() => {
        requestStub.restore();
      });

      it('stores the received cookies in the client', () => {
        return promise.then(() => {
          expect(Object.keys(client.cookies).length).to.eql(2);
          expect(client.cookies.foo.Name).to.eql('foo');
          expect(client.cookies.foo.Value).to.eql('bar');
          expect(client.cookies.baz.Name).to.eql('baz');
          expect(client.cookies.baz.Value).to.eql('foo');
        });
      });
    });

    describe('when the client has cookies', () => {
      beforeEach(() => {
        requestStub = sinon.stub(http, 'request').callsFake(fakeRequestMethod(true));
        client.cookies = {
          foo: { Name: 'foo', Value: 'bar' },
          baz: { Name: 'baz', Value: 'foo' },
        };
        promise = client.request({path: '/foo'});
      });

      afterEach(() => {
        requestStub.restore();
      });

      it('sends the stored cookies in the next request', () => {
        return promise.then(() => {
          expect(http.request.lastCall.args[0].headers.Cookies).to.eql('foo=bar; baz=foo');
        });
      });
    });
  });
});
