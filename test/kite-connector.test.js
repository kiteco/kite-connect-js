'use strict';

const http = require('http');
const sinon = require('sinon');
const expect = require('expect.js');

const {KiteConnector} = require('../lib');
const {waitsForPromise} = require('./helpers/async');
const {withKite} = require('./helpers/support');
const {fakeRequestMethod} = require('./helpers/http');

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
    withKite({running: true}, () => {
      beforeEach(() => {
        requestStub = sinon.stub(http, 'request')
        .callsFake(fakeRequestMethod(true));
      });

      it('returns a resolving promise', () => {
        return waitsForPromise(() => KiteConnector.waitForKite(5, 0));
      });
    });

    withKite({running: false}, () => {
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
});
