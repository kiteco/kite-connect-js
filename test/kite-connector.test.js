'use strict';

const sinon = require('sinon');
const expect = require('expect.js');

const {KiteConnector} = require('../lib');
const {waitsForPromise} = require('./helpers/async');
const {withKite, withKiteRoutes} = require('./helpers/support');
const {fakeResponse} = require('./helpers/http');

describe('KiteConnector', () => {
  let requestStub;

  afterEach(() => {
    requestStub && requestStub.restore();
  });

  describe('.canInstallKite()', () => {
    withKite({supported: false}, () => {
      it('returns a rejected promise', () => {
        return waitsForPromise({
          shouldReject: true,
        }, () => KiteConnector.canInstallKite());
      });
    });

    withKite({installed: true}, () => {
      it('returns a rejected promise', () => {
        return waitsForPromise({
          shouldReject: true,
        }, () => KiteConnector.canInstallKite());
      });
    });

    withKite({installed: false}, () => {
      it('returns a resolved promise', () => {
        return waitsForPromise(() => KiteConnector.canInstallKite());
      });
    });
  });

  describe('.waitForKite()', () => {
    withKite({reachable: true}, () => {
      it('returns a resolving promise', () => {
        return waitsForPromise(() => KiteConnector.waitForKite(5, 0));
      });
    });

    withKite({reachable: false}, () => {
      beforeEach(() => {
        sinon.spy(KiteConnector, 'isKiteReachable');
      });

      it('returns a promise that will be rejected after the specified number of attempts', () => {
        return waitsForPromise({shouldReject: true}, () => KiteConnector.waitForKite(5, 0))
        .then(() => {
          expect(KiteConnector.isKiteReachable.callCount).to.eql(5);
        });
      });
    });
  });

  describe('.request()', () => {
    withKite({supported: false}, () => {
      it('returns a rejected promise with the UNSUPPORTED state', () => {
        return waitsForPromise({shouldReject: true}, () => KiteConnector.request({path: '/foo'}))
        .then(err => {
          expect(err.data).to.eql(KiteConnector.STATES.UNSUPPORTED);
        });
      });
    });

    withKite({supported: true}, () => {
      it('returns a rejected promise with the UNINSTALLED state', () => {
        return waitsForPromise({shouldReject: true}, () => KiteConnector.request({path: '/foo'}))
        .then(err => {
          expect(err.data).to.eql(KiteConnector.STATES.UNINSTALLED);
        });
      });
    });

    withKite({installed: true}, () => {
      it('returns a rejected promise with the NOT_RUNNING state', () => {
        return waitsForPromise({shouldReject: true}, () => KiteConnector.request({path: '/foo'}))
        .then(err => {
          expect(err.data).to.eql(KiteConnector.STATES.NOT_RUNNING);
        });
      });
    });

    withKite({running: true}, () => {
      it('returns a rejected promise with the UNREACHABLE state', () => {
        return waitsForPromise({shouldReject: true}, () => KiteConnector.request({path: '/foo'}))
        .then(err => {
          expect(err.data).to.eql(KiteConnector.STATES.UNREACHABLE);
        });
      });
    });

    withKite({reachable: true}, () => {
      withKiteRoutes([[
        o => o.path === '/foo',
        o => fakeResponse(401),
      ]]);
      it('returns a rejected promise with the UNLOGGED state', () => {
        return waitsForPromise({shouldReject: true}, () => KiteConnector.request({path: '/foo'}))
        .then(err => {
          expect(err.data).to.eql(KiteConnector.STATES.UNLOGGED);
        });
      });
    });

    withKite({reachable: true}, () => {
      withKiteRoutes([[
        o => o.path === '/foo',
        o => fakeResponse(403),
      ]]);

      it('returns a rejected promise with the NOT_WHITELISTED state', () => {
        return waitsForPromise({shouldReject: true}, () => KiteConnector.request({path: '/foo'}))
        .then(err => {
          expect(err.data).to.eql(KiteConnector.STATES.NOT_WHITELISTED);
        });
      });
    });
  });
});
