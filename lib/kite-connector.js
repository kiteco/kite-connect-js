const os = require('os');
const utils = require('./utils');
const KiteError = require('./kite-error');
const {STATES} = require('./constants');

module.exports = {
  STATES,

  adapter: (() => {
    switch (os.platform()) {
      case 'darwin': return require('./support/osx');
      case 'win32': return require('./support/windows');
      default: return require('./support/no-support');
    }
  })(),

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
        new KiteError('bad_state', STATES.INSTALLED)));
  },
};
