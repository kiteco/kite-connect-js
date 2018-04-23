'use strict';

const os = require('os');
const utils = require('./utils');
const KiteError = require('./kite-error');
const {STATES} = require('./constants');
const NodeClient = require('./clients/node');

module.exports = {
  STATES,

  adapter: (() => {
    switch (os.platform()) {
      case 'darwin': return require('./support/osx');
      case 'win32': return require('./support/windows');
      default: return require('./support/no-support');
    }
  })(),

  client: new NodeClient('localhost', '46624'),

  isKiteSupported() {
    return this.adapter.isKiteSupported()
      ? Promise.resolve()
      : Promise.reject({
        type: 'bad_state',
        data: STATES.UNSUPPORTED,
      });
  },

  canInstallKite() {
    return this.isKiteSupported()
    .then(() =>
      utils.reversePromise(this.adapter.isKiteInstalled(),
        new KiteError('bad_state', STATES.NOT_RUNNING)));
  },

  isKiteReachable() {
    return utils.anyPromise([
      this.adapter.isKiteRunning(),
      this.adapter.isKiteEnterpriseRunning(),
    ])
    .catch(errs => {
      throw errs.reduce((m, err) => {
        if (!m) { return err; }
        if (err.data > m.data) { return err; }
        return m;
      }, null);
    })
    .then(() => this.client.request({
      path: '/settings',
      method: 'GET',
    }).catch(err => {
      throw new KiteError('bad_state', STATES.UNREACHABLE);
    }));
  },

  waitForKite(attempts, interval) {
    return utils.retryPromise(() => this.isKiteReachable(), attempts, interval);
  },
};
