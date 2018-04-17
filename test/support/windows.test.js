
'use strict';

const fs = require('fs');
const proc = require('child_process');
const sinon = require('sinon');
const expect = require('expect.js');
const WindowsAdapter = require('../../lib/support/windows');

const {waitsForPromise} = require('../helpers/async');
const {fakeCommands} = require('../helpers/child_process');
const {
  fakeKiteInstallPaths, withKiteInstalled, withKiteRunning, withKiteNotRunning,
} = require('../helpers/system');

const PLATFORM = 'win32';

describe('WindowsAdapter', () => {
  fakeKiteInstallPaths(PLATFORM);

  describe('.isKiteInstalled()', () => {
    withKiteInstalled(PLATFORM, () => {
      it('returns a resolved promise', () => {
        return waitsForPromise(() => WindowsAdapter.isKiteInstalled());
      });
    });

    describe('when there is no file at the given path', () => {
      it('returns a rejected promise', () => {
        return waitsForPromise({
          shouldReject: true,
        }, () => WindowsAdapter.isKiteInstalled());
      });
    });
  });

  describe('.installKite()', () => {
    let unlinkSpy, commandsRestore;
    describe('when every command succeeds', () => {
      beforeEach(() => {
        unlinkSpy = sinon.stub(fs, 'unlinkSync');
        commandsRestore = fakeCommands({
          exec: {
            [WindowsAdapter.KITE_INSTALLER_PATH + ' --skip-onboarding --plugin-launch']: () => 0,
          },
        });
      });

      afterEach(() => {
        unlinkSpy.restore();
        commandsRestore.restore();
      });

      it('returns a resolved promise', () => {
        const options = {
          onInstallStart: sinon.spy(),
          onCopy: sinon.spy(),
          onRemove: sinon.spy(),
        };

        return waitsForPromise(() => WindowsAdapter.installKite(options))
        .then(() => {
          expect(proc.exec.called).to.be.ok();
          expect(fs.unlinkSync.calledWith(WindowsAdapter.KITE_INSTALLER_PATH)).to.be.ok();

          expect(options.onInstallStart.called).to.be.ok();
          expect(options.onCopy.called).to.be.ok();
          expect(options.onRemove.called).to.be.ok();
        });
      });
    });

    describe('when installing the app fails', () => {
      beforeEach(() => {
        commandsRestore = fakeCommands({
          exec: {
            [WindowsAdapter.KITE_INSTALLER_PATH + ' --skip-onboarding --plugin-launch']: () => 1,
          },
        });
      });

      afterEach(() => {
        commandsRestore.restore();
      });

      it('returns a rejected promise', () => {
        return waitsForPromise({shouldReject: true}, () => WindowsAdapter.installKite());
      });
    });

    describe('when removing the downloaded archive fails', () => {
      beforeEach(() => {
        unlinkSpy = sinon.stub(fs, 'unlinkSync').callsFake(() => {
          throw new Error('unlink failed');
        });
        commandsRestore = fakeCommands({
          exec: {
            [WindowsAdapter.KITE_INSTALLER_PATH + ' --skip-onboarding --plugin-launch']: () => 0,
          },
        });
      });

      afterEach(() => {
        unlinkSpy.restore();
        commandsRestore.restore();
      });

      it('returns a rejected promise', () => {
        return waitsForPromise({shouldReject: true}, () => WindowsAdapter.installKite());
      });
    });
  });

  describe('.isKiteRunning()', () => {
    describe('when kite is not installed', () => {
      it('returns a rejected promise', () => {
        return waitsForPromise({shouldReject: true}, () => WindowsAdapter.isKiteRunning());
      });
    });

    withKiteInstalled(PLATFORM, () => {
      describe('but not running', () => {
        beforeEach(() => {
          fakeCommands({
            'tasklist': (ps) => {
              ps.stdout('');
              return 0;
            },
          });
        });

        it('returns a rejected promise', () => {
          return waitsForPromise({shouldReject: true}, () => WindowsAdapter.isKiteRunning());
        });
      });

      withKiteRunning(PLATFORM, () => {
        it('returns a resolved promise', () => {
          return waitsForPromise(() => WindowsAdapter.isKiteRunning());
        });
      });
    });
  });

  describe('.runKite()', () => {
    describe('when kite is not installed', () => {
      it('returns a rejected function', () => {
        return waitsForPromise({shouldReject: true}, () => WindowsAdapter.runKite());
      });
    });

    withKiteRunning(PLATFORM, () => {
      it('returns a resolved function', () => {
        return waitsForPromise(() => WindowsAdapter.runKite());
      });
    });

    withKiteNotRunning(PLATFORM, () => {
      it('returns a resolved promise', () => {
        return waitsForPromise(() => WindowsAdapter.runKite())
        .then(() => {
          expect(proc.spawn.lastCall.args[0])
          .to.eql(WindowsAdapter.KITE_EXE_PATH);
        });
      });
    });
  });
});
