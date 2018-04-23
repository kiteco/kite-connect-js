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

  request(opts, data, timeout) {
    return this.client.request(opts, data, timeout)
    .catch(() => {
      return this.isKiteSupported()
      .then(() => this.isKiteInstalled())
      .then(() => this.isKiteRunning())
      .then(() => { throw new KiteError('bad_state', STATES.UNREACHABLE); });
    })
    .then(resp => {
      switch (resp.statusCode) {
        case 403:
          throw new KiteError('bad_state', STATES.NOT_WHITELISTED);
        case 401:
          throw new KiteError('bad_state', STATES.UNLOGGED);
        default:
          return resp;
      }
    });
  },

  isKiteSupported() {
    return this.adapter.isKiteSupported()
      ? Promise.resolve()
      : Promise.reject({
        type: 'bad_state',
        data: STATES.UNSUPPORTED,
      });
  },

  isKiteInstalled() {
    return this.adapter.isKiteInstalled();
  },

  isKiteRunning() {
    return this.adapter.isKiteRunning();
  },

  canInstallKite() {
    return this.isKiteSupported()
    .then(() =>
      utils.reversePromise(this.adapter.isKiteInstalled(),
        new KiteError('bad_state', STATES.NOT_RUNNING)));
  },

  isKiteReachable() {
    return this.client.request({
      path: '/settings',
      method: 'GET',
    }).catch(err => {
      throw new KiteError('bad_state', STATES.UNREACHABLE);
    });
  },

  waitForKite(attempts, interval) {
    return utils.retryPromise(() => this.isKiteReachable(), attempts, interval);
  },

  isUserAuthenticated() {
    return this.client.request({
      path: '/clientapi/user',
      method: 'GET',
    }).catch(err => {
      throw new KiteError('bad_state', STATES.UNREACHABLE);
    })
    .then((resp) => {
      switch (resp.statusCode) {
        case 200:
          return utils.handleResponseData(resp);
        case 401:
          throw new KiteError('bad_state', STATES.UNLOGGED);
        default:
          throw new KiteError('bad_status', resp.statusCode);
      }
    });
  },
};
