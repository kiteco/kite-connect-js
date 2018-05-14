'use strict';

const sinon = require('sinon');
const expect = require('expect.js');

const KiteConnector = require('../lib');
const BrowserClient = require('../lib/clients/browser');
const NodeClient = require('../lib/clients/node');
const {waitsForPromise} = require('./helpers/async');
const {withKite, withKiteRoutes} = require('./helpers/support');
const {fakeResponse} = require('./helpers/http');

describe('KiteConnector', () => {
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

  describe('.canRunKite()', () => {
    withKite({installed: false}, () => {
      it('returns a rejected promise', () => {
        return waitsForPromise({
          shouldReject: true,
        }, () => KiteConnector.canRunKite());
      });
    });

    withKite({running: true}, () => {
      it('returns a rejected promise', () => {
        return waitsForPromise({
          shouldReject: true,
        }, () => KiteConnector.canRunKite());
      });
    });

    withKite({running: false}, () => {
      it('returns a resolved promise', () => {
        return waitsForPromise(() => KiteConnector.canRunKite());
      });
    });
  });

  describe('.canRunKiteEnterprise()', () => {
    withKite({installedEnterprise: false}, () => {
      it('returns a rejected promise', () => {
        return waitsForPromise({
          shouldReject: true,
        }, () => KiteConnector.canRunKiteEnterprise());
      });
    });

    withKite({runningEnterprise: true}, () => {
      it('returns a rejected promise', () => {
        return waitsForPromise({
          shouldReject: true,
        }, () => KiteConnector.canRunKiteEnterprise());
      });
    });

    withKite({runningEnterprise: false}, () => {
      it('returns a resolved promise', () => {
        return waitsForPromise(() => KiteConnector.canRunKiteEnterprise());
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

  describe('.isUserAuthenticated()', () => {
    withKite({logged: false}, () => {
      it('returns a rejected promise', () => {
        return waitsForPromise({shouldReject: true}, () => KiteConnector.isUserAuthenticated());
      });
    });

    withKite({reachable: true}, () => {
      describe('when the request ends with another status code', () => {
        withKiteRoutes([[
          o => o.path === '/clientapi/user',
          o => fakeResponse(404),
        ]]);

        it('returns a rejected promise', () => {
          return waitsForPromise({shouldReject: true}, () => KiteConnector.isUserAuthenticated());
        });
      });
    });

    withKite({logged: true}, () => {
      it('returns a resolving promise', () => {
        return waitsForPromise(() => KiteConnector.isUserAuthenticated());
      });
    });

  });

  [
    ['isKiteInstalled'],
    ['isKiteRunning'],
    ['installKite', {foo: 'bar'}],
    ['downloadKiteRelease', {foo: 'bar'}],
    ['downloadKite', 'http://kite.com', {foo: 'bar'}],
    ['runKite'],
    ['isKiteEnterpriseInstalled'],
    ['isKiteEnterpriseRunning'],
    ['runKiteEnterprise'],
    ['hasBothKiteInstalled'],
  ].forEach(([method, ...args]) => {
    describe(`.${method}()`, () => {
      let stub;

      withKite({}, () => {
        beforeEach(() => {
          stub = sinon.stub(KiteConnector.adapter, method).callsFake(() => {});
        });

        afterEach(() => {
          stub.restore();
        });

        it('delegates the call to the adapter', () => {
          KiteConnector[method](...args);
          expect(KiteConnector.adapter[method].calledWith(...args)).to.be.ok();
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

      describe('with a onDidFailRequest listener', () => {
        let failSpy, disposable;
        beforeEach(() => {
          failSpy = sinon.spy();
          disposable = KiteConnector.onDidFailRequest(failSpy);
        });

        it('unregisters the listener when calling dispose() on the disposable', () => {
          disposable.dispose();

          return waitsForPromise({shouldReject: true}, () => KiteConnector.request({path: '/foo'}))
          .then(() => {
            expect(failSpy.called).not.to.be.ok();
          });
        });

        it('notifies the listener of the failure', () => {
          return waitsForPromise({shouldReject: true}, () => KiteConnector.request({path: '/foo'}))
          .then(() => {
            expect(failSpy.called).to.be.ok();
            expect(failSpy.lastCall.args[0].data).to.eql(KiteConnector.STATES.UNSUPPORTED);
          });
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

    withKite({reachable: true}, () => {
      withKiteRoutes([[
        o => o.path === '/foo',
        o => fakeResponse(404, 'not found'),
      ]]);

      it('returns a rejected promise with the NOT_WHITELISTED state', () => {
        return waitsForPromise({shouldReject: true}, () => KiteConnector.request({path: '/foo'}))
        .then(err => {
          expect(err.type).to.eql('bad_status');
          expect(err.data).to.eql(404);
          expect(err.content).to.eql('not found');
        });
      });
    });

    withKite({reachable: true}, () => {
      withKiteRoutes([[
        o => o.path === '/foo',
        o => fakeResponse(200),
      ]]);

      it('returns a resolved promise with the response object', () => {
        return waitsForPromise(() => KiteConnector.request({path: '/foo'}))
        .then(resp => {
          expect(resp.statusCode).to.eql(200);
        });
      });
    });
  });

  describe('.checkHealth()', () => {
    withKite({supported: false}, () => {
      it('returns a promise resolved with the corresponding state', () => {
        return waitsForPromise(() => KiteConnector.checkHealth())
        .then(state => {
          expect(state).to.eql(KiteConnector.STATES.UNSUPPORTED);
        });
      });
    });

    withKite({installed: false}, () => {
      it('returns a promise resolved with the corresponding state', () => {
        return waitsForPromise(() => KiteConnector.checkHealth())
        .then(state => {
          expect(state).to.eql(KiteConnector.STATES.UNINSTALLED);
        });
      });
    });

    withKite({running: false}, () => {
      it('returns a promise resolved with the corresponding state', () => {
        return waitsForPromise(() => KiteConnector.checkHealth())
        .then(state => {
          expect(state).to.eql(KiteConnector.STATES.INSTALLED);
        });
      });
    });

    withKite({reachable: false}, () => {
      it('returns a promise resolved with the corresponding state', () => {
        return waitsForPromise(() => KiteConnector.checkHealth())
        .then(state => {
          expect(state).to.eql(KiteConnector.STATES.RUNNING);
        });
      });
    });

    withKite({logged: false}, () => {
      it('returns a promise resolved with the corresponding state', () => {
        return waitsForPromise(() => KiteConnector.checkHealth())
        .then(state => {
          expect(state).to.eql(KiteConnector.STATES.REACHABLE);
        });
      });
    });

    withKite({reachable: true}, () => {
      withKiteRoutes([[
        o => o.path === '/clientapi/user',
        o => fakeResponse(500),
      ]]);
      describe('and an unexpected response from Kite', () => {
        it('returns a rejected promise', () => {
          return waitsForPromise({shouldReject: true}, () => KiteConnector.checkHealth());
        });
      });
    });

    withKite({logged: true}, () => {
      it('returns a promise resolved with the corresponding state', () => {
        return waitsForPromise(() => KiteConnector.checkHealth())
        .then(state => {
          expect(state).to.eql(KiteConnector.STATES.AUTHENTICATED);
        });
      });
    });
  });

  describe('.toggleRequestDebug()', () => {
    describe('called with no arguments', () => {
      it('switches the client back and forth', () => {
        KiteConnector.toggleRequestDebug();
        expect(KiteConnector.client instanceof BrowserClient).to.be.ok();
        expect(KiteConnector.client.hostname).to.eql('localhost');
        expect(KiteConnector.client.port).to.eql(46624);

        KiteConnector.toggleRequestDebug();
        expect(KiteConnector.client instanceof NodeClient).to.be.ok();
        expect(KiteConnector.client.hostname).to.eql('localhost');
        expect(KiteConnector.client.port).to.eql(46624);
      });
    });
  });
});
