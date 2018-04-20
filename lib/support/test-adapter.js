'use strict';

module.exports = (setup) => {
  return {
    get releaseURL() {
      return setup.releaseURL;
    },

    get downloadPath() {
      return setup.downloadPath;
    },

    get installPath() {
      return setup.allInstallPath[0];
    },

    get allInstallPath() {
      return setup.allInstallPath;
    },

    get enterpriseInstallPath() {
      return setup.allEnterpriseInstallPath[0];
    },

    get allEnterpriseInstallPath() {
      return setup.allEnterpriseInstallPath;
    },

    get sessionFilePath() {
      return setup.sessionFilePath;
    },

    get localTokenPath() {
      return setup.localTokenPath;
    },

    hasManyKiteInstallation() {
      return setup.allInstallPath.length > 1;
    },

    hasManyKiteEnterpriseInstallation() {
      return setup.allEnterpriseInstallPath.length > 1;
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
        : Promise.reject();
    },

    downloadKite(opts) {
      return setup.canDownload
        ? Promise.resolve()
        : Promise.reject();
    },

    installKite(opts) {
      return !setup.install
        ? Promise.resolve()
        : Promise.reject();
    },

    isKiteRunning() {
      return setup.running
        ? Promise.resolve()
        : Promise.reject();
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
      return setup.installEnterprise
        ? Promise.resolve()
        : Promise.reject();
    },

    isKiteEnterpriseRunning() {
      return setup.runningEnterprise
        ? Promise.resolve()
        : Promise.reject();
    },

    runKiteEnterprise() {
      return setup.canRunEnterprise
        ? Promise.resolve()
        : Promise.reject();
    },
  };
};
