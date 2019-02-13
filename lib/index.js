'use strict';

const os = require('os');
const EventEmitter = require('events');

const utils = require('./utils');
const KiteStateError = require('./kite-state-error');
const KiteRequestError = require('./kite-request-error');
const {STATES} = require('./constants');
const NodeClient = require('./clients/node');
const BrowserClient = require('./clients/browser');

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

  toggleRequestDebug() {
    if (this.client instanceof NodeClient) {
      this.client = new BrowserClient(this.client.hostname, this.client.port);
    } else {
      this.client = new NodeClient(this.client.hostname, this.client.port);
    }
  },

  onDidFailRequest(listener) {
    this.emitter.on('did-fail-request', listener);
    return {
      dispose: () => {
        this.emitter.removeListener('did-fail-request', listener);
      },
    };
  },

  request(options, data, timeout) {
    console.log('KITE-CONNECT req', options)
    return this.client.request(options, data, timeout)
    .catch(() => {
      return this.isKiteSupported()
      .then(() => this.isKiteInstalled())
      .then(() => this.isKiteRunning())
      .then(() => {
        throw new KiteStateError('Kite could not be reached when attempting a request', {
          state: STATES.UNREACHABLE,
          request: options,
          requestData: data,
        });
      });
    })
    .then(resp => {
      return resp.statusCode >= 400
        ? utils.handleResponseData(resp).then(respData => {
          throw new KiteRequestError('bad_status', {
            responseStatus: resp.statusCode,
            request: options,
            requestData: data,
            response: resp,
            responseData: respData,
          });
        })
        : resp;
    })
    .catch(err => {
      console.log('KITE-CONNECT failure', options)
      console.log('KITE CONNECT ERROR', err)
      this.emitter.emit('did-fail-request', err);
      throw err;
    });
  },

  checkHealth() {
    const extractErr = ([err]) => {
      throw err;
    };

    return this.isKiteSupported()
    .then(() =>
      utils.anyPromise([this.isKiteInstalled(), this.isKiteEnterpriseInstalled()]).catch(extractErr))
    .then(() =>
      utils.anyPromise([this.isKiteRunning(), this.isKiteEnterpriseRunning()]).catch(extractErr))
    .then(() => this.isKiteReachable())
    .then(() => STATES.READY)
    .catch(err => {
      if (!err.data || err.data.state == null) { throw err; }
      return err.data.state;
    });
  },

  // FIXME: This method is now deprecated, use checkHealth instead.
  handleState() {
    return this.checkHealth();
  },

  isKiteSupported() {
    return this.adapter.isKiteSupported()
      ? Promise.resolve()
      : Promise.reject(new KiteStateError('Kite is currently not support on your platform', {
        state: STATES.UNSUPPORTED,
      }));
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
        new KiteStateError('Kite is already installed', {
          state: STATES.INSTALLED,
        })));
  },

  installKite(options) {
    return this.adapter.installKite(options);
  },

  downloadKiteRelease(options) {
    return this.adapter.downloadKiteRelease(options);
  },

  downloadKite(url, options) {
    return this.adapter.downloadKite(url, options);
  },

  canRunKite() {
    return this.isKiteInstalled()
    .then(() =>
      utils.reversePromise(this.isKiteRunning(),
        new KiteStateError('Kite is already runnning', {
          state: STATES.RUNNING,
        })));
  },

  runKite() {
    return this.adapter.runKite();
  },

  runKiteAndWait(attempts, interval) {
    return this.runKite().then(() => this.waitForKite(attempts, interval));
  },

  isKiteReachable() {
    return this.client.request({
      path: '/clientapi/ping',
      method: 'GET',
    }, null, 100); // in tests, this took no longer than 15ms to respond
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
        new KiteStateError('Kite Enterprise is already runnning', {
          state: STATES.RUNNING,
        })));
  },

  runKiteEnterprise() {
    return this.adapter.runKiteEnterprise();
  },

  runKiteEnterpriseAndWait(attempts, interval) {
    return this.runKiteEnterprise().then(() => this.waitForKite(attempts, interval));
  },

  hasBothKiteInstalled() {
    return this.adapter.hasBothKiteInstalled();
  },

  hasManyKiteInstallation() {
    return this.adapter.hasManyKiteInstallation();
  },

  hasManyKiteEnterpriseInstallation() {
    return this.adapter.hasManyKiteEnterpriseInstallation();
  },

  isAdmin() {
    return this.adapter.isAdmin();
  },

  arch() {
    return this.adapter.arch();
  },

  isOSSupported() {
    return this.adapter.isOSSupported();
  },

  isOSVersionSupported() {
    return this.adapter.isOSVersionSupported();
  },
};
