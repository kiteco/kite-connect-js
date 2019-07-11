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
  KITE_INSTALLER_PATH: '/tmp/kite-installer.sh',
  KITED_PATH: path.join(os.homedir(), '.local', 'share', 'kite', 'kited'),
  KITED_PROCESS: /kited/,
  KITE_CURRENT_LINK: path.join(os.homedir(), '.local', 'share', 'kite', 'current'),

  memKitedInstallPath: null,

  get releaseURL() {
    return this.RELEASE_URL;
  },

  get downloadPath() {
    return this.KITE_INSTALLER_PATH;
  },

  get installPath() {
    if (!this.memKitedInstallPath) {
      if (fs.existsSync(this.KITED_PATH)) {
        this.memKitedInstallPath = this.KITED_PATH;
      }
      //fixme what if path didn't exist?
    }
    return this.memKitedInstallPath;
  },

  resetInstallPath() {
    this.memKitedInstallPath = null;
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
      const userInfo = os.userInfo();
      return userInfo.uid === 0 || userInfo.username === "root";
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
    let arch = os.arch();
    return arch === "x64";
  },

  isKiteSupported() {
    return this.isOSSupported() && this.isOSVersionSupported();
  },

  isKiteInstalled() {
    return new Promise((resolve, reject) => {
      fs.exists(this.installPath, exists => {
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

  // downloads the latest version of kite-installer.sh
  // and uses it to retrieve the current binary installer and installation data
  downloadKiteRelease(opts) {
    return this.downloadKite(this.releaseURL, opts || {});
  },

  downloadKite(url, opts) {
    opts = opts || {};
    return this.downloadKiteInstallerScript(url)
    .then(() => this.streamKiteDownload(this.downloadPath, opts.onDownloadProgress))
    .then(() => utils.guardCall(opts.onDownload))
    .then(() => opts.install && this.installKite(opts));
  },

  downloadKiteInstallerScript(url) {
    console.log("downloading script from " + url)
    const req = https.request(url);
    req.end();

    return utils.followRedirections(req)
    .then(resp => {
      return utils.promisifyStream(resp.pipe(fs.createWriteStream(this.downloadPath)))
      .then(() => new Promise((resolve, reject) => {
        setTimeout(resolve, 100);
      }));
    });
  },

  streamKiteDownload(scriptPath, progress) {
    return new Promise((resolve, reject) => {
      try {
        // fixme remove after testing
        let path = "/home/jansorg/go/src/github.com/kiteco/kiteco/linux/docker/kite-installer.sh";
        if (fs.existsSync(path)) {
          scriptPath = path
          fs.copyFileSync(path, this.KITE_INSTALLER_PATH)
        }

        console.log(`"${scriptPath}" --download`)

        const child = child_process.spawn(scriptPath, ["--download"], {shell: true})
        if (progress) {
          let last = -1
          child.stdout.on('data', chunk => {
            // chunk is a buffer when used with spawn
            let line = chunk.toString('utf8')
            let pattern = /^Download: (\d+)\/(\d+)$/;
            let match = pattern.exec(line)
            if (match) {
              let received = parseInt(match[1]);
              let total = parseInt(match[2]);
              if (received >= 0 && total > 0 && total >= received) {
                if (received > last) {
                  last = received
                  if (received === total) {
                    progress(total, total, 1.0)
                  } else {
                    progress(received, total, received / total)
                  }
                }
              }
            }
          })
        }

        child.on('close', function (code) {
          console.log('child process exited with code ' + code);
          if (code === 0) {
            resolve(child)
          } else {
            reject(code)
          }
        });
        // child.addListener("error", reject)
        // child.addListener("exit", (code) => {
        //   console.error("exit " + code)
        //   if (code === 0) {
        //     resolve(child)
        //   } else {
        //     reject(code)
        //   }
        // })
      } catch (e) {
        console.error(e)
        reject(e)
      }
    })
  },

  installKite(opts) {
    opts = opts || {};

    utils.guardCall(opts.onInstallStart);
    return utils.spawnPromise("bash", [`"${this.KITE_INSTALLER_PATH}"`, "--install"],
    'kite-installer install error', `unable to install kite from ${this.KITE_INSTALLER_PATH}`)
    .catch((err) => {
      // if permissions error, send message directing how complete with
      // given installer path
      // fixme permission errors
      // if (err.code === 'EPERM' || err.errno === 'EPERM') {
      //   throw new KiteProcessError('kite-installer.sh EPERM', {
      //     message: `Installing ${this.KITE_INSTALLER_PATH} failed due to lacking root permissions.
      //     In your command line, try running \`sudo apt install -f ${this.KITE_INSTALLER_PATH}\` to finish installing Kite`,
      //     cmd: `bash ${this.KITE_INSTALLER_PATH} install`,
      //   });
      // } else {
      // throw err;
      // }
      console.error("error installing kite: " + err)
    })
    .then(() => this.resetInstallPath()) // force recalculation of mem'd path on successful install
    .then(() => utils.guardCall(opts.onMount))
    .then(() => fs.unlinkSync(this.KITE_INSTALLER_PATH))
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
        if (!fs.existsSync(this.installPath)) {
          throw new Error('kited is not installed');
        }
        child_process.spawn(
        this.installPath,
        ['--plugin-launch', '--channel=autocomplete-python'],
        {detached: true, env});
      } catch (e) {
        throw new KiteProcessError('kited_error',
        {
          message: (e.message && e.message === 'kited is not installed') || 'unable to run kited binary',
          callStack: e.stack,
          cmd: this.installPath,
          options: {detached: true, env},
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
