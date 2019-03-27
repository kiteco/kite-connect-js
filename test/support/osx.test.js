'use strict';

const proc = require('child_process');
const https = require('https');
const sinon = require('sinon');
const expect = require('expect.js');

const OSXAdapter = require('../../lib/support/osx');

const {waitsForPromise} = require('../helpers/async');
const {fakeResponse, withFakeServer} = require('../helpers/http');
const {fakeCommands} = require('../helpers/child_process');
const {
  fakeKiteInstallPaths, withKiteInstalled, withKiteRunning, withKiteNotRunning,
  withKiteEnterpriseInstalled, withBothKiteInstalled,
  withKiteEnterpriseRunning, withKiteEnterpriseNotRunning,
} = require('../helpers/system');
const { customEnv } = require('../helpers/utils');
const { kiteDownloadRoutes } = require('../helpers/kite');
 
const PLATFORM = 'darwin';

describe('OSXAdapter', () => {
  fakeKiteInstallPaths(PLATFORM);

  describe('.isKiteInstalled()', () => {
    withKiteInstalled(PLATFORM, () => {
      it('returns a resolved promise', () => {
        return waitsForPromise(() => OSXAdapter.isKiteInstalled());
      });
    });

    describe('when kite is not installed', () => {
      it('returns a rejected promise', () => {
        return waitsForPromise({
          shouldReject: true,
        }, () => OSXAdapter.isKiteInstalled());
      });
    });

    withKiteEnterpriseInstalled(PLATFORM, () => {
      it('returns a rejected promise', () => {
        return waitsForPromise({shouldReject: true}, () =>
          OSXAdapter.isKiteInstalled());
      });
    });
  });

  describe('.isKiteEnterpriseInstalled()', () => {
    describe('when kite enterprise is not installed', () => {
      it('returns a rejected promise', () => {
        return waitsForPromise({shouldReject: true}, () =>
          OSXAdapter.isKiteEnterpriseInstalled());
      });
    });

    withKiteInstalled(PLATFORM, () => {
      it('returns a rejected promise', () => {
        return waitsForPromise({shouldReject: true}, () =>
          OSXAdapter.isKiteEnterpriseInstalled());
      });
    });

    withKiteEnterpriseInstalled(PLATFORM, () => {
      it('returns a resolved promise', () => {
        return waitsForPromise(() => OSXAdapter.isKiteEnterpriseInstalled());
      });
    });
  });

  describe('.hasBothKiteInstalled()', () => {
    describe('when no kite is installed', () => {
      it('returns a rejected promise', () => {
        return waitsForPromise({shouldReject: true}, () =>
        OSXAdapter.hasBothKiteInstalled());
      });
    });

    describe('when kite enterprise is not installed', () => {
      withKiteInstalled(PLATFORM, () => {
        it('returns a rejected promise', () => {
          return waitsForPromise({shouldReject: true}, () =>
          OSXAdapter.hasBothKiteInstalled());
        });
      });
    });

    describe('when kite is not installed', () => {
      withKiteEnterpriseInstalled(PLATFORM, () => {
        it('returns a rejected promise', () => {
          return waitsForPromise({shouldReject: true}, () =>
          OSXAdapter.hasBothKiteInstalled());
        });
      });
    });

    withBothKiteInstalled(PLATFORM, () => {
      it('returns a resolved promise', () => {
        return waitsForPromise(() => OSXAdapter.hasBothKiteInstalled());
      });
    });
  });

  describe('.downloadKite()', () => {
    withFakeServer(kiteDownloadRoutes, () => {
      describe('when the download succeeds', () => {
        beforeEach(() => {
          fakeCommands({
            hdiutil: () => 0,
            cp: () => 0,
            rm: () => 0,
            mdfind: (ps) => {
              ps.stdout('');
              return 0;
            },
          });
        });

        describe('with the install option', () => {
          it('returns a promise resolved after the install', () => {
            const options = {
              install: true,
              onDownload: sinon.spy(),
              onInstallStart: sinon.spy(),
              onMount: sinon.spy(),
              onCopy: sinon.spy(),
              onUnmount: sinon.spy(),
              onRemove: sinon.stub().callsFake(() => {
                fakeCommands({
                  mdfind: (ps, args) => {
                    const [, key] = args[0].split(/\s=\s/);
                    key === '"com.kite.Kite"'
                      ? ps.stdout('/Applications/Kite.app')
                      : ps.stdout('');
                    return 0;
                  },
                });
              }),
            };
            const url = 'https://kite.com/download';

            return OSXAdapter.downloadKite(url, options)
            .then(() => {
              expect(https.request.calledWith(url)).to.be.ok();
              expect(proc.spawn.calledWith('hdiutil', [
                'attach', '-nobrowse',
                OSXAdapter.KITE_DMG_PATH,
              ])).to.be.ok();
              expect(proc.spawn.calledWith('cp', [
                '-r',
                OSXAdapter.KITE_APP_PATH.mounted,
                OSXAdapter.APPS_PATH,
              ])).to.be.ok();
              expect(proc.spawn.calledWith('hdiutil', [
                'detach',
                OSXAdapter.KITE_VOLUME_PATH,
              ])).to.be.ok();
              expect(proc.spawn.calledWith('rm', [
                OSXAdapter.KITE_DMG_PATH,
              ])).to.be.ok();

              expect(options.onDownload.called).to.be.ok();
              expect(options.onInstallStart.called).to.be.ok();
              expect(options.onMount.called).to.be.ok();
              expect(options.onCopy.called).to.be.ok();
              expect(options.onUnmount.called).to.be.ok();
              expect(options.onRemove.called).to.be.ok();
            });
          });
        });
      });
    });
  });

  describe('.installKite()', () => {
    describe('when every command succeeds', () => {
      beforeEach(() => {
        fakeCommands({
          hdiutil: () => 0,
          cp: () => 0,
          rm: () => 0,
          mdfind: (ps, args) => {
            const [, key] = args[0].split(/\s=\s/);
            key === '"com.kite.Kite"'
              ? ps.stdout('/Applications/Kite.app')
              : ps.stdout('');
            return 0;
          },
        });
      });

      it('returns a resolved promise', () => {
        const options = {
          onInstallStart: sinon.stub(),
          onMount: sinon.stub(),
          onCopy: sinon.stub(),
          onUnmount: sinon.stub(),
          onRemove: sinon.stub(),
        };

        return waitsForPromise(() => OSXAdapter.installKite(options))
        .then(() => {
          expect(proc.spawn.calledWith('hdiutil', [
            'attach', '-nobrowse',
            OSXAdapter.KITE_DMG_PATH,
          ])).to.be.ok();
          expect(proc.spawn.calledWith('cp', [
            '-r',
            OSXAdapter.KITE_APP_PATH.mounted,
            OSXAdapter.APPS_PATH,
          ])).to.be.ok();
          expect(proc.spawn.calledWith('hdiutil', [
            'detach',
            OSXAdapter.KITE_VOLUME_PATH,
          ])).to.be.ok();
          expect(proc.spawn.calledWith('rm', [
            OSXAdapter.KITE_DMG_PATH,
          ])).to.be.ok();
          expect(proc.spawn.calledWith('mdfind', [
            'kMDItemCFBundleIdentifier = "com.kite.Kite"',
          ])).to.be.ok();

          expect(options.onInstallStart.called).to.be.ok();
          expect(options.onMount.called).to.be.ok();
          expect(options.onCopy.called).to.be.ok();
          expect(options.onUnmount.called).to.be.ok();
          expect(options.onRemove.called).to.be.ok();
        });
      });
    });

    describe('when mounting the archive fails', () => {
      beforeEach(() => {
        fakeCommands({
          hdiutil: () => 1,
          cp: () => 0,
          rm: () => 0,
        });
      });

      it('returns a rejected promise', () => {
        return waitsForPromise({shouldReject: true}, () => OSXAdapter.installKite());
      });
    });

    describe('when copying the archive content fails', () => {
      beforeEach(() => {
        fakeCommands({
          hdiutil: () => 0,
          cp: () => 1,
          rm: () => 0,
        });
      });

      it('returns a rejected promise', () => {
        return waitsForPromise({shouldReject: true}, () => OSXAdapter.installKite());
      });
    });

    describe('when unmounting the archive fails', () => {
      beforeEach(() => {
        fakeCommands({
          hdiutil: (ps, [command]) => command === 'attach' ? 0 : 1,
          cp: () => 0,
          rm: () => 0,
        });
      });

      it('returns a rejected promise', () => {
        return waitsForPromise({shouldReject: true}, () => OSXAdapter.installKite());
      });
    });

    describe('when removing the downloaded archive fails', () => {
      beforeEach(() => {
        fakeCommands({
          hdiutil: () => 0,
          cp: () => 0,
          rm: () => 1,
        });
      });

      it('returns a rejected promise', () => {
        return waitsForPromise({shouldReject: true}, () => OSXAdapter.installKite());
      });
    });
  });

  describe('.isKiteRunning()', () => {
    describe('when kite is not installed', () => {
      it('returns a rejected promise', () => {
        return waitsForPromise({shouldReject: true}, () => OSXAdapter.isKiteRunning());
      });
    });

    withKiteInstalled(PLATFORM, () => {
      describe('but not running', () => {
        beforeEach(() => {
          fakeCommands({
            '/bin/ps': (ps) => {
              ps.stdout('');
              return 0;
            },
          });
        });

        it('returns a rejected promise', () => {
          return waitsForPromise({shouldReject: true}, () => OSXAdapter.isKiteRunning());
        });
      });

      withKiteRunning(PLATFORM, () => {
        it('returns a resolved promise', () => {
          return waitsForPromise(() => OSXAdapter.isKiteRunning());
        });
      });
    });
  });

  describe('.runKite()', () => {
    describe('when kite is not installed', () => {
      it('returns a rejected function', () => {
        return waitsForPromise({shouldReject: true}, () => OSXAdapter.runKite());
      });
    });

    withKiteRunning(PLATFORM, () => {
      it('returns a resolved function', () => {
        return waitsForPromise(() => OSXAdapter.runKite());
      });
    });

    withKiteNotRunning(PLATFORM, () => {
      it('returns a resolved promise', () => {
        return waitsForPromise(() => OSXAdapter.runKite())
        .then(() => {
          expect(proc.spawn.calledWith('defaults', [
            'write', 'com.kite.Kite', 'shouldReopenSidebar', '0',
          ])).to.be.ok();

          expect(proc.spawn.calledWith('open', [
            '-a', OSXAdapter.installPath, '--args', '--plugin-launch', '--channel=autocomplete-python',
          ], customEnv(process.env, null, ['ELECTRON_RUN_AS_NODE']))).to.be.ok();
        });
      });
    });
  });

  describe('.isKiteEnterpriseRunning()', () => {
    describe('when kite is not installed', () => {
      it('returns a rejected promise', () => {
        return waitsForPromise({shouldReject: true}, () => OSXAdapter.isKiteEnterpriseRunning());
      });
    });

    withKiteEnterpriseInstalled(PLATFORM, () => {
      describe('but not running', () => {
        beforeEach(() => {
          fakeCommands({
            '/bin/ps': (ps) => {
              ps.stdout('');
              return 0;
            },
          });
        });

        it('returns a rejected promise', () => {
          return waitsForPromise({shouldReject: true}, () => OSXAdapter.isKiteEnterpriseRunning());
        });
      });

      withKiteEnterpriseRunning(PLATFORM, () => {
        it('returns a resolved promise', () => {
          return waitsForPromise(() => OSXAdapter.isKiteEnterpriseRunning());
        });
      });
    });
  });

  describe('.runKiteEnterprise()', () => {
    describe('when kite is not installed', () => {
      it('returns a rejected function', () => {
        return waitsForPromise({shouldReject: true}, () => OSXAdapter.runKiteEnterprise());
      });
    });

    withKiteEnterpriseRunning(PLATFORM, () => {
      it('returns a rejected function', () => {
        return waitsForPromise({shouldReject: true}, () => OSXAdapter.runKiteEnterprise());
      });
    });

    withKiteEnterpriseNotRunning(PLATFORM, () => {
      it('returns a resolved promise', () => {
        return waitsForPromise(() => OSXAdapter.runKiteEnterprise())
        .then(() => {
          expect(proc.spawn.calledWith('defaults', [
            'write', 'enterprise.kite.Kite', 'shouldReopenSidebar', '0',
          ])).to.be.ok();

          expect(proc.spawn.calledWith('open', [
            '-a', OSXAdapter.enterpriseInstallPath,
          ], customEnv(process.env, null, ['ELECTRON_RUN_AS_NODE']))).to.be.ok();
        });
      });
    });
  });

  describe('.isAdmin()', () => {
    describe('when the user is an admin', () => {
      beforeEach(() => {
        fakeCommands({
          exec: {
            whoami: (ps) => {
              ps.stdout('username');
              return 0;
            },
            'dscacheutil -q group -a name admin': (ps) => {
              ps.stdout('users: username');
              return 0;
            },
          },
        });
      });

      it('returns true', () => {
        expect(OSXAdapter.isAdmin()).to.be.ok();
      });
    });

    describe('when the user is not an admin', () => {
      beforeEach(() => {
        fakeCommands({
          exec: {
            whoami: (ps) => {
              ps.stdout('username');
              return 0;
            },
            'dscacheutil -q group -a name admin': (ps) => {
              ps.stdout('users: foo bar baz');
              return 0;
            },
          },
        });
      });

      it('returns false', () => {
        expect(OSXAdapter.isAdmin()).not.to.be.ok();
      });
    });
  });
});
