'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const https = require('https');
const child_process = require('child_process');
const utils = require('../utils.js');
const KiteStateError = require('../kite-state-error');
const KiteProcessError = require('../kite-process-error');

const {STATES} = require('../constants');

const KEY_BAT = `"${path.join(__dirname, 'read-key.bat')}"`;
const ARCH_BAT = `"${path.join(__dirname, 'read-arch.bat')}"`;
let COMPUTED_INSTALL_PATH;

const WindowsSupport = {
  RELEASE_URL: 'https://alpha.kite.com/release/dls/windows/current',
  KITE_INSTALLER_PATH: path.join(os.tmpdir(), 'KiteSetup.exe'),
  SESSION_FILE_PATH: path.join(process.env.LOCALAPPDATA, 'Kite', 'session.json'),

  // We're only setting the install path in tests
  set KITE_EXE_PATH(path) {
    COMPUTED_INSTALL_PATH = path;
  },
  get KITE_EXE_PATH() {
    if (!COMPUTED_INSTALL_PATH) {
      let installDir, fallbackInstallDir;

      if (process.env.ProgramW6432) {
        fallbackInstallDir = path.join(process.env.ProgramW6432, 'Kite');
      } else {
        // TODO: report that even the fallback needed a fallback
        fallbackInstallDir = 'C:\\Program Files\\Kite';
      }

      try {
        const registryDir = String(child_process.execSync(KEY_BAT)).trim();

        installDir = registryDir !== 'not found'
          ? registryDir
          : fallbackInstallDir;
      } catch (err) {
        installDir = fallbackInstallDir;
      }
      COMPUTED_INSTALL_PATH = path.join(installDir, 'kited.exe');
    }

    return COMPUTED_INSTALL_PATH;
  },

  get releaseURL() {
    return this.RELEASE_URL;
  },

  get downloadPath() {
    return this.KITE_INSTALLER_PATH;
  },

  get installPath() {
    return this.KITE_EXE_PATH;
  },

  get enterpriseInstallPath() {
    return null;
  },

  get allInstallPaths() {
    return [this.installPath];
  },

  get allEnterpriseInstallPaths() {
    return [];
  },

  get sessionFilePath() {
    return this.SESSION_FILE_PATH;
  },

  isAdmin() {
    try {
      // Note that this method can still fail if the server has not been started
      // but it has the merit of being simple and reliable
      // see https://stackoverflow.com/questions/4051883/batch-script-how-to-check-for-admin-rights
      // for details
      child_process.execSync('net session');
      return true;
    } catch (e) {
      return false;
    }
  },

  arch() {
    /* if (!this.cachedArch) { this.cachedArch = os.arch(); }
    
    // for backwards compatibility, we don't just return the direct result of the os call
    if (this.cachedArch === 'x32') { return '32bit'; }
    if (this.cachedArch === 'x64') { return '64bit'; }
    
    return this.cachedArch; */
    
    // we are lax here due to an edge case with a 32bit vscode running on a 64bit
    // os that results in Node getting the architecture of the VSCode environment vs.
    // the architecture of the OS itself
    // Ultimately, this deserves more thought in terms of its handling
    return '64bit';
  },

  isOSSupported() {
    return true;
  },

  isOSVersionSupported() {
    return parseFloat(os.release()) >= 6.1 &&
           this.arch() === '64bit';
  },

  isKiteSupported() {
    return this.isOSVersionSupported();
  },

  isKiteInstalled() {
    return new Promise((resolve, reject) => {
      fs.exists(this.KITE_EXE_PATH, (exists) => {
        if (exists) {
          resolve();
        } else {
          reject(new KiteStateError('', {
            state: STATES.UNINSTALLED,
          }));
        }
      });
    });
  },

  isKiteEnterpriseInstalled() {
    return Promise.reject(new KiteStateError('Kite Enterprise is currently not supported on windows', {
      state: STATES.UNSUPPORTED,
    }));
  },

  hasManyKiteInstallation() {
    return this.allInstallPaths.length > 1;
  },

  hasManyKiteEnterpriseInstallation() {
    return this.allEnterpriseInstallPaths.length > 1;
  },

  hasBothKiteInstalled() {
    return Promise.all([
      this.isKiteInstalled(),
      this.isKiteEnterpriseInstalled(),
    ]);
  },

  downloadKiteRelease(opts) {
    return this.downloadKite(this.releaseURL, opts || {});
  },

  downloadKite(url, opts) {
    opts = opts || {};
    return this.streamKiteDownload(url, opts.onDownloadProgress)
    .then(() => utils.guardCall(opts.onDownload))
    .then(() => opts.install && this.installKite(opts));
  },

  streamKiteDownload(url, progress) {
    const req = https.request(url);
    req.end();

    return utils.followRedirections(req)
    .then(resp => {
      if (progress) {
        const total = parseInt(resp.headers['content-length'], 10);
        let length = 0;

        resp.on('data', chunk => {
          length += chunk.length;
          progress(length, total, length / total);
        });
      }

      return utils.promisifyStream(
        resp.pipe(fs.createWriteStream(this.downloadPath))
      )
      .then(() => new Promise((resolve, reject) => {
        setTimeout(resolve, 100);
      }));
    });
  },

  installKite(opts) {
    opts = opts || {};
    var env = Object.create(process.env);
    env.KITE_SKIP_ONBOARDING = '1';

    utils.guardCall(opts.onInstallStart);
    return utils.execPromise(
      `"${this.KITE_INSTALLER_PATH}"` + ' --skip-onboarding --plugin-launch-with-copilot --channel=autocomplete-python',
      {env: env},
      'kite_install_error',
      'Unable to run Kite installer')
    .then(() => utils.guardCall(opts.onCopy))
    .then(() => fs.unlinkSync(this.KITE_INSTALLER_PATH))
    .then(() => utils.guardCall(opts.onRemove));
  },

  isKiteRunning() {
    return utils.spawnPromise(
      'tasklist',
      'tasklist_error',
      'Unable to run the tasklist command and verify whether kite is running or not')
    .then(stdout => {
      const procs = stdout.split('\n');
      if (procs.every(l => l.indexOf('kited.exe') === -1)) {
        throw new KiteStateError('Unable to find kited.exe process in the tasks list', {
          state: STATES.NOT_RUNNING,
        });
      }
    });
  },

  runKite(openCopilot) {
    return this.isKiteRunning()
    .catch(() => {
      var env = Object.create(process.env);
      delete env["ELECTRON_RUN_AS_NODE"];
      if (!openCopilot){
        env.KITE_SKIP_ONBOARDING = '1';
      }

      const kiteArgs = openCopilot !== false
        ? ['--plugin-launch-with-copilot', '--channel=autocomplete-python']
        : ['--plugin-launch', '--channel=autocomplete-python'];

      try {
        child_process.spawn(
          this.KITE_EXE_PATH,
          kiteArgs,
          {detached: true, env: env});
      } catch (err) {
        throw new KiteProcessError('kite_exe_error',
          {
            message: 'Unable to run kite executable',
            callStack: err.stack,
            cmd: this.KITE_EXE_PATH,
            options: {detached: true, env: env},
          });
      }
    });
  },

  isKiteEnterpriseRunning() {
    return Promise.reject(new KiteStateError('Kite Enterprise is currently not supported on windows', {
      state: STATES.UNSUPPORTED,
    }));
  },

  runKiteEnterprise() {
    return Promise.reject(new KiteStateError('Kite Enterprise is currently not supported on windows', {
      state: STATES.UNSUPPORTED,
    }));
  },
};

module.exports = WindowsSupport;
