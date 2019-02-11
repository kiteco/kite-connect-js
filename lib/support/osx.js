'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const https = require('https');
const child_process = require('child_process');
const utils = require('../utils.js');
const KiteStateError = require('../kite-state-error');
const {STATES} = require('../constants');

const OSXSupport = {
  RELEASE_URL: 'https://alpha.kite.com/release/dls/mac/current',
  APPS_PATH: '/Applications/',
  KITE_DMG_PATH: '/tmp/Kite.dmg',
  KITE_VOLUME_PATH: '/Volumes/Kite/',
  KITE_APP_PATH: {mounted: '/Volumes/Kite/Kite.app', defaultInstalled: '/Applications/Kite.app'},
  KITE_SIDEBAR_PATH: '/Applications/Kite.app/Contents/MacOS/KiteSidebar.app',
  KITE_BUNDLE_ID: 'com.kite.Kite',
  SESSION_FILE_PATH: path.join(os.homedir(), '.kite', 'session.json'),

  get releaseURL() {
    return this.RELEASE_URL;
  },

  get downloadPath() {
    return this.KITE_DMG_PATH;
  },

  get installPath() {
    return this.allInstallPaths[0];
  },

  get allInstallPaths() {
    let paths = String(child_process.spawnSync('mdfind', [
      'kMDItemCFBundleIdentifier = "com.kite.Kite"',
    ]).stdout).trim().split('\n');
    if (paths.indexOf(this.KITE_APP_PATH.defaultInstalled) === -1 && this.checkDefaultAppPath()) {
      paths.push(this.KITE_APP_PATH.defaultInstalled);
    }
    return paths.filter(p => p !== '');
  },

  get enterpriseInstallPath() {
    return this.allEnterpriseInstallPaths[0];
  },

  get allEnterpriseInstallPaths() {
    return String(child_process.spawnSync('mdfind', [
      'kMDItemCFBundleIdentifier = "enterprise.kite.Kite"',
    ]).stdout).trim().split('\n');
  },

  get sessionFilePath() {
    return this.SESSION_FILE_PATH;
  },

  isAdmin() {
    try {
      const user = String(child_process.execSync('whoami')).trim();
      const adminUsers = String(child_process.execSync('dscacheutil -q group -a name admin'))
      .split('\n')
      .filter(l => /^users:/.test(l))[0]
      .trim()
      .replace(/users:\s+/, '')
      .split(/\s/g);
      return adminUsers.includes(user);
    } catch (e) {
      return false;
    }
  },

  arch() {
    return os.arch();
  },

  isOSSupported() {
    return true;
  },

  isOSVersionSupported() {
    return parseFloat(os.release()) >= 14;
  },

  isKiteSupported() {
    return this.isOSVersionSupported();
  },

  checkDefaultAppPath() {
    return fs.existsSync(this.KITE_APP_PATH.defaultInstalled);
  },

  isKiteInstalled() {
    return utils.spawnPromise(
      'mdfind',
      ['kMDItemCFBundleIdentifier = "com.kite.Kite"'],
      'mdfind_error',
      'Unable to run mdfind and verify that Kite is installed')
    .then(res => {
      if ((!res || res.trim() === '') && !this.checkDefaultAppPath()) {
        throw new KiteStateError('Unable to find Kite application install using mdfind', {
          state: STATES.UNINSTALLED,
        });
      }
    });
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

  isKiteEnterpriseInstalled() {
    return utils.spawnPromise(
      'mdfind',
      ['kMDItemCFBundleIdentifier = "enterprise.kite.Kite"'],
      'mdfind_error',
      'Unable to run mdfind and verify that kite enterprise is installed')
    .then(res => {
      if (!res || res.trim() === '') {
        throw new KiteStateError('Unable to find Kite Enterprise application install using mdfind', {
          state: STATES.UNINSTALLED,
        });
      }
    });
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

    utils.guardCall(opts.onInstallStart);
    return utils.spawnPromise(
      'hdiutil',
      ['attach', '-nobrowse', this.KITE_DMG_PATH],
      'mount_error',
      'Unable to mount Kite.dmg')
    .then(() => utils.guardCall(opts.onMount))
    .then(() => utils.spawnPromise(
      'cp',
      ['-r', this.KITE_APP_PATH.mounted, this.APPS_PATH],
      'cp_error',
      'Unable to copy Kite.app in the applications directory'))
    .then(() => utils.guardCall(opts.onCopy))
    .then(() => utils.spawnPromise(
      'hdiutil',
      ['detach', this.KITE_VOLUME_PATH],
      'unmount_error',
      'Unable to unmount Kite.dmg'))
    .then(() => utils.guardCall(opts.onUnmount))
    .then(() => utils.spawnPromise(
      'rm', [this.KITE_DMG_PATH],
      'rm_error',
      'Unable to remove Kite.dmg'))
    .then(() => utils.guardCall(opts.onRemove))
    // mdfind takes some time to index the app location, so we need to
    // wait for the install to fully complete. Runs 10 times at 1.5s
    // intervals.
    .then(() => utils.retryPromise(() => this.isKiteInstalled(), 10, 1500));
  },

  isKiteRunning() {
    return utils.spawnPromise(
      '/bin/ps',
      ['-axco', 'command'],
      {encoding: 'utf8'},
      'ps_error',
      'Unable to run the ps command and verify that Kite is running')
    .then(stdout => {
      const procs = stdout.split('\n');
      if (!procs.some(s => /^Kite$/.test(s))) {
        throw new KiteStateError('Kite process could not be found in the processes list', {
          state: STATES.NOT_RUNNING,
        });
      }
    });
  },

  runKite() {
    const env = Object.assign({}, process.env);
    delete env['ELECTRON_RUN_AS_NODE'];
    console.log('runKite ENV', env);
    console.log('CAN I EVEN SEE THIS')

    return this.isKiteRunning()
    .catch(() => utils.spawnPromise(
      'defaults',
      ['write', 'com.kite.Kite', 'shouldReopenSidebar', '0'],
      'defaults_error',
      'Unable to run defaults command')
    .then(() =>
    utils.spawnPromise(
      'open',
      ['-a', this.installPath, '--args', '"--plugin-launch"'],
      { env: env },
      'open_error',
      'Unable to run the open command to start Kite'
    )));
  },

  isKiteEnterpriseRunning() {
    return utils.spawnPromise(
      '/bin/ps',
      ['-axco', 'command'],
      {encoding: 'utf8'},
      'ps_error',
      'Unable to run the ps command and verify that Kite enterprise is running')
    .then(stdout => {
      const procs = stdout.split('\n');
      if (!procs.some(s => /^KiteEnterprise$/.test(s))) {
        throw new KiteStateError('Kite Enterprise process could not be found in the processes list', {
          state: STATES.NOT_RUNNING,
        });
      }
    });
  },

  runKiteEnterprise() {
    const env = Object.assign({}, process.env);
    delete env['ELECTRON_RUN_AS_NODE'];

    return utils.spawnPromise(
      'defaults',
      ['write', 'enterprise.kite.Kite', 'shouldReopenSidebar', '0'],
      'defaults_error',
      'Unable to run defaults command')
    .then(() =>
      utils.spawnPromise(
        'open',
        ['-a', this.enterpriseInstallPath],
        { env: env },
        'open_error',
        'Unable to run the open command and start Kite enterprise'));
  },
};

module.exports = OSXSupport;
