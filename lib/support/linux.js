'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const https = require('https');
const child_process = require('child_process');

const utils = require('../utils');
const KiteStateError = require('../kite-state-error');
const KiteProcessError = require('../kite-process-error');

const {STATES} = require('../constants');

const LinuxSupport = {
  RELEASE_URL: 'https://linux.kite.com/dls/linux/current',
  SESSION_FILE_PATH: path.join(os.homedir(), '.kite', 'session.json'),
  LINUX_FLAG_PATH: path.join(os.homedir(), '.kite', 'PLUGIN_DEBUG'),
  KITE_DEB_PATH: '/tmp/kite-installer.deb',
  KITED_PATH: '/opt/kite/kited',
  KITED_PROCESS: /kited/,
  KITE_CURRENT_LINK: '/opt/kite/current',

  get releaseURL() {
    return this.RELEASE_URL;
  },

  get downloadPath() {
    return this.KITE_DEB_PATH;
  },

  get installPath() {
    return this.KITED_PATH;
  },

  get allInstallPaths() {
    return [this.installPath];
  },

  get enterpriseInstallPath() {
    return null;
  },

  get allEnterpriseInstallPaths() {
    return null;
  },

  get sessionFilePath() {
    return this.SESSION_FILE_PATH;
  },

  hasManyKiteInstallation() {
    return this.allInstallPaths.length > 1;
  },

  hasManyKiteEnterpriseInstallation() {
    return false;
  },

  isAdmin() {
    try {
      const user = utils.whoami();
      const adminUsers = String(child_process.execSync('getent group root adm admin sudo'))
      .split('\n')
      .map(line => line.substring(line.lastIndexOf(':') + 1))
      .reduce((acc, val) => {
        val.split(',').forEach(token => acc.push(token.trim()));
        return acc;
      }, []);
      return adminUsers.includes(user);
    } catch (e) {
      return false;
    }
  },

  arch() {
    return os.arch();
  },

  isOSSupported() {
    // TODO(dane): adjust this for official release - will otherwise cause problems
    // with e.g. ACP users
    return fs.existsSync(this.LINUX_FLAG_PATH);
  },

  isOSVersionSupported() {
    // get version info from parsing output of process `lsb_release -r`
    // which should be sufficient for Ubuntu distros
    try {
      const output = String(child_process.execSync('lsb_release -r'));
      const version = parseFloat(output.substring(output.search(/\d/)).trim()); // find index of first digit
      if (isNaN(version)) {
        return false;
      }
      return version >= 18.04 && os.arch() === 'x64'; // we only support 18.04+ currently
    } catch (e) {
      return false;
    }
  },

  isKiteSupported() {
    return this.isOSSupported() && this.isOSVersionSupported();
  },

  isKiteInstalled() {
    return new Promise((resolve, reject) => {
      fs.exists(this.KITED_PATH, exists => {
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

  // TODO(dane): move outside of specific adapter with same methods in osx and windows
  downloadKiteRelease(opts) {
    return this.downloadKite(this.releaseURL, opts || {});
  },

  downloadKite(url, opts) {
    // TODO(dane): move outside of specific adapter with same methods in osx and windows
    opts = opts || {};
    return this.streamKiteDownload(url, opts.onDownloadProgress)
    .then(() => utils.guardCall(opts.onDownload))
    .then(() => opts.install && this.installKite(opts));
  },

  // TODO(dane): move outside of specific adapter with smae methods in osx and windows
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

    utils.guardCall(opts.onInstallStart);
    // need install path
    return utils.spawnPromise(
      'sudo',
      ['apt-get', 'install', '-f', this.KITE_DEB_PATH],
      'apt-get install error',
      'unable to install kite from kite-installer.deb')
    .then(() => utils.guardCall(opts.onMount))
    .then(() => fs.unlinkSync(this.KITE_DEB_PATH))
    .then(() => utils.guardCall(opts.onRemove));
  },

  isKiteRunning() {
    return utils.spawnPromise(
      '/bin/ps',
      ['-axo', 'pid,command'],
      {encoding: 'utf-8'},
      'ps_error',
      'unable to run the ps command and verify that Kite is running')
    .then(stdout => {
      const procs = stdout.split('\n');

      if (!procs.some(p => this.KITED_PROCESS.test(p))) {
        throw new KiteStateError('Kite process could not be found in the processes list', {
          state: STATES.NOT_RUNNING,
        });
      }
    });
  },

  runKite() {
    return this.isKiteRunning()
    .catch(() => {
      const env = Object.assign({}, process.env);
      env.SKIP_KITE_ONBOARDING = '1';
      delete env['ELECTRON_RUN_AS_NODE'];

      try {
        if (!fs.existsSync(this.KITED_PATH)) {
          throw new Error('kited is not installed');
        }
        child_process.spawn(
          this.KITED_PATH,
          ['--plugin-launch', '--channel=autocomplete-python'],
          { detached: true, env });
      } catch (e) {
        throw new KiteProcessError('kited_error',
          {
            message: (e.message && e.message === 'kited is not installed') || 'unable to run kited binary',
            callStack: e.stack,
            cmd: this.KITED_PATH,
            options: { detached: true, env },
          });
      }
    });
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

module.exports = LinuxSupport;