'use strict';

const KiteStateError = require('../kite-state-error');

const {STATES} = require('../constants');

module.exports = {
  get releaseURL() {
    return null;
  },

  get downloadPath() {
    return null;
  },

  get installPath() {
    return null;
  },

  get allInstallPaths() {
    return null;
  },

  get enterpriseInstallPath() {
    return null;
  },

  get allEnterpriseInstallPaths() {
    return null;
  },

  get sessionFilePath() {
    return null;
  },

  hasManyKiteInstallation() {
    return false;
  },

  hasManyKiteEnterpriseInstallation() {
    return false;
  },

  isAdmin() {
    return false;
  },

  arch() {
    return null;
  },

  isOSSupported() {
    return false;
  },

  isOSVersionSupported() {
    return false;
  },

  isKiteSupported() {
    return false;
  },

  hasKiteConfig() {
    return false;
  },

  isKiteInstalled() {
    return this.notSupported();
  },

  downloadKite(opts) {
    return this.notSupported();
  },

  installKite(opts) {
    return this.notSupported();
  },

  isKiteRunning() {
    return this.notSupported();
  },

  runKite() {
    return this.notSupported();
  },

  hasBothKiteInstalled() {
    return Promise.all([
      this.isKiteInstalled(),
      this.isKiteEnterpriseInstalled(),
    ]);
  },

  isKiteEnterpriseInstalled() {
    return this.notSupported();
  },

  isKiteEnterpriseRunning() {
    return this.notSupported();
  },

  runKiteEnterprise() {
    return this.notSupported();
  },

  notSupported() {
    return Promise.reject(
      new KiteStateError('Your platform is currently not supported', {
        state: STATES.UNSUPPORTED,
      }));
  },
};
