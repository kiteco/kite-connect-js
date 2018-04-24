'use strict';

const expect = require('expect.js');
const KiteConnector = require('../lib');
const {withKite} = require('./helpers/support');
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
    it('is not logged', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isUserAuthenticated());
    });
  });

  withKite({
    supported: false,
    installed: true,
    running: true,
    reachable: true,
    logged: true,
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
    it('is not logged', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isUserAuthenticated());
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
    it('is not logged', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isUserAuthenticated());
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
    it('is not logged', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isUserAuthenticated());
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
    it('is not logged', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isUserAuthenticated());
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
    it('is not logged', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isUserAuthenticated())
      .then(err => {
        expect(err.data).to.eql(KiteConnector.STATES.UNREACHABLE);
      });
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
    it('is not logged', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isUserAuthenticated())
      .then(err => {
        expect(err.data).to.eql(KiteConnector.STATES.UNREACHABLE);
      });
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
    it('is not logged', () => {
      return waitsForPromise({shouldReject: true}, () => KiteConnector.isUserAuthenticated())
      .then(err => {
        expect(err.data).to.eql(KiteConnector.STATES.UNLOGGED);
      });
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
    it('is logged', () => {
      return waitsForPromise(() => KiteConnector.isUserAuthenticated());
    });
  });
});
