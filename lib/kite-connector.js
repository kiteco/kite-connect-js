'use strict';

const os = require('os');
const EventEmitter = require('events');

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

  emitter: new EventEmitter(),

  client: new NodeClient('localhost', '46624'),

  onDidFailRequest(listener) {
    this.emitter.on('did-fail-request', listener);
    return {
      dispose: () => {
        this.emitter.removeListener('did-fail-request', listener);
      },
    };
  },

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
        case 200:
          return resp;
        case 403:
          throw new KiteError('bad_state', STATES.NOT_WHITELISTED);
        case 401:
          throw new KiteError('bad_state', STATES.UNLOGGED);
        default:
          return utils.handleResponseData(resp, data => {
            throw new KiteError('bad_status', resp.statusCode, data);
          });
      }
    })
    .catch(err => {
      this.emitter.emit('did-fail-request', err);
      throw err;
    });
  },

  checkHealth() {
    return this.isKiteSupported()
    .then(() => this.isKiteInstalled())
    .then(() => this.isKiteRunning())
    .then(() => this.isKiteReachable())
    .then(() => this.isUserAuthenticated())
    .then(() => STATES.AUTHENTICATED)
    .catch(err => {
      if (err.type !== 'bad_state') { throw err; }
      return err.data;
    });
  },

  // FIXME: This method is now deprecated, use checkHealth instead.
  handleState() {
    return this.checkHealth();
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

  installKite(opts) {
    return this.adapter.installKite(opts);
  },

  downloadKiteRelease(opts) {
    return this.adapter.downloadKiteRelease(opts);
  },

  downloadKite(url, opts) {
    return this.adapter.downloadKite(url, opts);
  },

  canRunKite() {
    return this.isKiteInstalled()
    .then(() =>
      utils.reversePromise(this.isKiteRunning(),
        new KiteError('bad_state', STATES.RUNNING)));
  },

  runKite() {
    return this.adapter.runKite();
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

  isKiteEnterpriseInstalled() {
    return this.adapter.isKiteEnterpriseInstalled();
  },

  isKiteEnterpriseRunning() {
    return this.adapter.isKiteEnterpriseRunning();
  },

  canRunKiteEnterprise() {
    return this.isKiteEnterpriseInstalled()
    .then(() =>
      utils.reversePromise(this.isKiteEnterpriseRunning(),
        new KiteError('bad_state', STATES.RUNNING)));
  },

  runKiteEnterprise() {
    return this.adapter.runKiteEnterprise();
  },

  hasBothKiteInstalled() {
    return this.adapter.hasBothKiteInstalled();
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
