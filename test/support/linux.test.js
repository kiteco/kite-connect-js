'use strict';

const proc = require('child_process');
const fs = require('fs');
const https = require('https');
const sinon = require('sinon');
const expect = require('expect.js');

const LinuxAdapter = require('../../lib/support/linux');

const {waitsForPromise} = require('../helpers/async');
const {withFakeServer} = require('../helpers/http');
const {fakeCommands} = require('../helpers/child_process');
const {
  withKiteInstalled, withKiteRunning, withKiteNotRunning,
} = require('../helpers/system');
const { kiteDownloadRoutes } = require('../helpers/kite');

const PLATFORM = 'linux';

describe('LinuxAdapter', () => {
  
  describe('.isAdmin()', () => {
    describe('when the user is an admin', () => {
      beforeEach(() => {
        fakeCommands({
          exec: {
            whoami: (ps) => {
              ps.stdout('username');
              return 0;
            },
            'getent group root adm admin sudo': (ps) => {
              ps.stdout('root:x:0:\nadm:x:4:syslog,username\nsudo:x:27:username');
              return 0;
            },
          },
        });
      });

      it('returns true', () => {
        expect(LinuxAdapter.isAdmin()).to.be.ok();
      });
    });

    describe('when the user is not an admin', () => {
      beforeEach(() => {
        fakeCommands({
          exec: {
            whoami: (ps) => {
              ps.stdout('fake');
              return 0;
            },
            'getent group root adm admin sudo': (ps) => {
              ps.stdout('root:x:0:\nadm:x:4:syslog,username\nsudo:x:27:username');
              return 0;
            },
          },
        });
      });

      it('returns false', () => {
        expect(LinuxAdapter.isAdmin()).not.to.be.ok();
      });
    });
  });

  describe('.isOSVersionSupported()', () => {
    describe('when the os version is not supported', () => {
      beforeEach(() => {
        fakeCommands({
          exec: {
            'lsb_release -r': (ps) => {
              ps.stdout('Release:	16.04');
              return 0;
            },
          },
        });
      });

      it('returns false', () => {
        expect(LinuxAdapter.isOSVersionSupported()).not.to.be.ok();
      });
    });

    describe('when the os version is supported', () => {
      beforeEach(() => {
        fakeCommands({
          exec: {
            'lsb_release -r': (ps) => {
              ps.stdout('Release:	18.04');
              return 0;
            },
          },
        });
      });

      it('returns true', () => {
        expect(LinuxAdapter.isOSVersionSupported()).to.be.ok();
      });
    });
  });

  describe('.isKiteInstalled()', () => {
    withKiteInstalled(PLATFORM, () => {
      it('returns a resolved promise', () => {
        return waitsForPromise(() => LinuxAdapter.isKiteInstalled());
      });
    });

    describe('when kite is not installed', () => {
      it('returns a rejected promise', () => {
        return waitsForPromise({
          shouldReject: true,
        }, () => LinuxAdapter.isKiteInstalled());
      });
    });
  });

  describe('.downloadKite()', () => {
    withFakeServer(kiteDownloadRoutes, () => {
      describe('when the download succeeds', () => {
        let unlinkSpy;
        beforeEach(() => {
          unlinkSpy = sinon.stub(fs, 'unlinkSync');

          fakeCommands({
            apt: () => 0,
          });
        });

        afterEach(() => {
          unlinkSpy.restore();
        });

        describe('with the install option', () => {
          it('returns a promise resolved after the install', () => {
            const options = {
              install: true,
              onInstallStart: sinon.spy(),
              onMount: sinon.spy(),
              onRemove: sinon.spy(),
            };
            const url = 'https://kite.com/download';

            LinuxAdapter.downloadKite(url, options)
            .then(() => {
              expect(https.request.calledWith(url)).to.be.ok();
              expect(proc.spawn.calledWith('apt', 
                ['install', '-f', LinuxAdapter.KITE_DEB_PATH])).to.be.ok();
              
              expect(fs.unlinkSync.calledWith(LinuxAdapter.KITE_DEB_PATH)).to.be.ok();

              expect(options.onInstallStart.called).to.be.ok();
              expect(options.onMount.called).to.be.ok();
              expect(options.onRemove.called).to.be.ok();
            });
          });
        });
      });
    });
  });

  describe('.installKite()', () => {
    let unlinkSpy;
    describe('when the total installation succeeds', () => {
      beforeEach(() => {
        unlinkSpy = sinon.stub(fs, 'unlinkSync');
        fakeCommands({
          apt: () => 0,
        });
      });

      afterEach(() => {
        unlinkSpy.restore();
      });

      it('returns a resolved promise', () => {
        const options = {
          onInstallStart: sinon.stub(),
          onMount: sinon.stub(),
          onRemove: sinon.stub(),
        };
        return waitsForPromise(() => LinuxAdapter.installKite(options))
        .then(() => {
          expect(proc.spawn.calledWith('apt', [
            'install', '-f', LinuxAdapter.KITE_DEB_PATH,
          ])).to.be.ok();
          expect(fs.unlinkSync.calledWith(LinuxAdapter.KITE_DEB_PATH)).to.be.ok();

          expect(options.onInstallStart.called).to.be.ok();
          expect(options.onMount.called).to.be.ok();
          expect(options.onRemove.called).to.be.ok();
        });
      });
    });

    describe('when the installation fails', () => {
      beforeEach(() => {
        fakeCommands({
          apt: () => 1,
        });
      });

      it('returns a rejected promise', () => {
        return waitsForPromise({
          shouldReject: true,
        }, () => LinuxAdapter.installKite());
      });
    });

    describe('when removing the deb fails', () => {
      beforeEach(() => {
        unlinkSpy = sinon.stub(fs, 'unlinkSync').throws('unlink failed');
        fakeCommands({
          apt: () => 0,
        });
      });

      afterEach(() => {
        unlinkSpy.restore();
      });

      it('returns a rejected promise', () => {
        return waitsForPromise({
          shouldReject: true,
        }, () => LinuxAdapter.installKite());
      });
    });
  });

  describe('.isKiteRunning()', () => {
    describe('when kite is not installed', () => {
      it('returns a rejected promise', () => {
        return waitsForPromise({
          shouldReject: true,
        }, () => LinuxAdapter.isKiteRunning());
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
          return waitsForPromise({
            shouldReject: true,
          }, () => LinuxAdapter.isKiteRunning());
        });
      });

      withKiteRunning(PLATFORM, () => {
        it('returns a resolved promise', () => {
          return waitsForPromise(() => LinuxAdapter.isKiteRunning());
        });
      });
    });
  });

  describe('.runKite()', () => {
    let existSpy;
    describe('when kite is not installed', () => {
      beforeEach(() => {
        existSpy = sinon.stub(fs, 'existsSync').returns(false);
      });

      afterEach(() => {
        existSpy.restore();
      });

      it('returns a rejected promise', () => {
        return waitsForPromise({shouldReject: true}, () => LinuxAdapter.runKite());
      });
    });

    withKiteRunning(PLATFORM, () => {
      beforeEach(() => {
        existSpy = sinon.stub(fs, 'existsSync').returns(true);
      });

      afterEach(() => {
        existSpy.restore();
      });

      it('returns a resolved promise', () => {
        return waitsForPromise(() => LinuxAdapter.runKite());
      });
    });

    withKiteNotRunning(PLATFORM, () => {
      beforeEach(() => {
        existSpy = sinon.stub(fs, 'existsSync').returns(true);
      });

      afterEach(() => {
        existSpy.restore();
      });

      it('returns a resolved promise', () => {
        return waitsForPromise(() => LinuxAdapter.runKite())
          .then(() => {
            expect(proc.spawn.lastCall.args[0])
            .to.eql(LinuxAdapter.KITED_PATH);
          });
      });
    });
  });
});