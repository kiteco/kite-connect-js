'use strict';

const KiteError = require('../kite-error');
const {STATES} = require('../constants');

module.exports = (setup) => {
  return {
    get releaseURL() {
      return setup.releaseURL;
    },

    get downloadPath() {
      return setup.downloadPath;
    },

    get installPath() {
      return setup.allInstallPaths[0];
    },

    get allInstallPaths() {
      return setup.allInstallPaths;
    },

    get enterpriseInstallPath() {
      return setup.allEnterpriseInstallPaths[0];
    },

    get allEnterpriseInstallPaths() {
      return setup.allEnterpriseInstallPaths;
    },

    get sessionFilePath() {
      return setup.sessionFilePath;
    },

    hasManyKiteInstallation() {
      return setup.allInstallPaths.length > 1;
    },

    hasManyKiteEnterpriseInstallation() {
      return setup.allEnterpriseInstallPaths.length > 1;
    },

    isAdmin() {
      return !!setup.admin;
    },

    arch() {
      return setup.arch;
    },

    isOSSupported() {
      return setup.supported;
    },

    isOSVersionSupported() {
      return setup.supported;
    },

    isKiteSupported() {
      return setup.supported;
    },

    isKiteInstalled() {
      return setup.installed
        ? Promise.resolve()
        : Promise.reject(new KiteError('bad_state', STATES.UNINSTALLED));
    },

    downloadKite(opts) {
      return setup.canDownload
        ? Promise.resolve()
        : Promise.reject();
    },

    installKite(opts) {
      return !setup.installed
        ? Promise.resolve()
        : Promise.reject();
    },

    isKiteRunning() {
      return setup.running
        ? Promise.resolve()
        : Promise.reject(new KiteError('bad_state', STATES.NOT_RUNNING));
    },

    runKite() {
      return !setup.running
        ? Promise.resolve()
        : Promise.reject();
    },

    hasBothKiteInstalled() {
      return Promise.all([
        this.isKiteInstalled(),
        this.isKiteEnterpriseInstalled(),
      ]);
    },

    isKiteEnterpriseInstalled() {
      return setup.installedEnterprise
        ? Promise.resolve()
        : Promise.reject(new KiteError('bad_state', STATES.UNINSTALLED));
    },

    isKiteEnterpriseRunning() {
      return setup.runningEnterprise
        ? Promise.resolve()
        : Promise.reject(new KiteError('bad_state', STATES.NOT_RUNNING));
    },

    runKiteEnterprise() {
      return !setup.runningEnterprise
        ? Promise.resolve()
        : Promise.reject();
    },
  };
};
