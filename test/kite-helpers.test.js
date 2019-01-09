'use strict';

const expect = require('expect.js');
const KiteConnector = require('../lib');
const {withKite} = require('./helpers/kite');
const {waitsForPromise} = require('./helpers/async');

describe('withKite', () => {
  withKite({supported: false}, () => {
    it('is not supported', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isKiteSupported());
    });
    it('is not installed', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isKiteInstalled());
    });
    it('is not running', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isKiteRunning());
    });
    it('is not reachable', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isKiteReachable());
    });
  });

  withKite({
    supported: false,
    installed: true,
    running: true,
    reachable: true,
  }, () => {
    it('is not supported', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isKiteSupported());
    });
    it('is not installed', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isKiteInstalled());
    });
    it('is not running', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isKiteRunning());
    });
    it('is not reachable', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isKiteReachable());
    });
  });

  withKite({supported: true}, () => {
    it('is supported', () => {
      return waitsForPromise(() => KiteConnector.isKiteSupported());
    });
    it('is not installed', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isKiteInstalled());
    });
    it('is not running', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isKiteRunning());
    });
    it('is not reachable', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isKiteReachable());
    });
  });

  withKite({installed: true}, () => {
    it('is supported', () => {
      return waitsForPromise(() => KiteConnector.isKiteSupported());
    });
    it('is installed', () => {
      return waitsForPromise(() => KiteConnector.isKiteInstalled());
    });
    it('is not running', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isKiteRunning());
    });
    it('is not reachable', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isKiteReachable());
    });
  });

  withKite({installedEnterprise: true}, () => {
    it('is supported', () => {
      return waitsForPromise(() => KiteConnector.isKiteSupported());
    });
    it('community Kite is installed', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isKiteInstalled());
    });
    it('enterprise Kite is installed', () => {
      return waitsForPromise(() => KiteConnector.isKiteEnterpriseInstalled());
    });
    it('enterprise Kite is not running', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isKiteEnterpriseRunning());
    });
    it('is not reachable', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isKiteReachable());
    });
  });

  withKite({running: true}, () => {
    it('is supported', () => {
      return waitsForPromise(() => KiteConnector.isKiteSupported());
    });
    it('is installed', () => {
      return waitsForPromise(() => KiteConnector.isKiteInstalled());
    });
    it('is running', () => {
      return waitsForPromise(() => KiteConnector.isKiteRunning());
    });
    it('is not reachable', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isKiteReachable());
    });
  });

  withKite({runningEnterprise: true}, () => {
    it('is supported', () => {
      return waitsForPromise(() => KiteConnector.isKiteSupported());
    });
    it('community Kite is not installed', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isKiteInstalled());
    });
    it('community Kite is not running', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isKiteRunning());
    });
    it('enterprise Kite is installed', () => {
      return waitsForPromise(() => KiteConnector.isKiteEnterpriseInstalled());
    });
    it('enterprise Kite is running', () => {
      return waitsForPromise(() => KiteConnector.isKiteEnterpriseRunning());
    });
    it('is not reachable', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isKiteReachable());
    });
  });

  withKite({reachable: true}, () => {
    it('is supported', () => {
      return waitsForPromise(() => KiteConnector.isKiteSupported());
    });
    it('is installed', () => {
      return waitsForPromise(() => KiteConnector.isKiteInstalled());
    });
    it('is running', () => {
      return waitsForPromise(() => KiteConnector.isKiteRunning());
    });
    it('is reachable', () => {
      return waitsForPromise(() => KiteConnector.isKiteReachable());
    });
  });

  withKite({logged: true}, () => {
    it('is supported', () => {
      return waitsForPromise(() => KiteConnector.isKiteSupported());
    });
    it('is installed', () => {
      return waitsForPromise(() => KiteConnector.isKiteInstalled());
    });
    it('is running', () => {
      return waitsForPromise(() => KiteConnector.isKiteRunning());
    });
    it('is reachable', () => {
      return waitsForPromise(() => KiteConnector.isKiteReachable());
    });
  });
});
