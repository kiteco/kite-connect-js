
const expect = require('expect.js');
const {waitsForPromise} = require('../helpers/async');
const testAdapter = require('../../lib/support/test-adapter');

describe('TestAdapter', () => {
  [
    'releaseURL',
    'downloadPath',
    'allInstallPath',
    'allEnterpriseInstallPath',
    'sessionFilePath',
    'localTokenPath',
  ].forEach(getter => {
    describe(`.${getter} when setup with "foo"`, () => {
      it('returns "foo"', () => {
        expect(testAdapter({[getter]: 'foo'})[getter]).to.eql('foo');
      });
    });
  });

  describe('.installPath', () => {
    describe('when setup with allInstallPath: ["foo"]', () => {
      it('returns "foo"', () => {
        expect(testAdapter({allInstallPath: ['foo']}).installPath).to.eql('foo');
      });
    });
  });

  describe('.enterpriseInstallPath', () => {
    describe('when setup with allEnterpriseInstallPath: ["foo"]', () => {
      it('returns "foo"', () => {
        expect(testAdapter({allEnterpriseInstallPath: ['foo']}).enterpriseInstallPath).to.eql('foo');
      });
    });
  });

  [
    ['arch', {arch: 'foo'}, 'foo'],
    ['hasManyKiteInstallation', {allInstallPath: ['foo']}, false],
    ['hasManyKiteInstallation', {allInstallPath: ['foo', 'bar']}, true],
    ['hasManyKiteEnterpriseInstallation', {allEnterpriseInstallPath: ['foo']}, false],
    ['hasManyKiteEnterpriseInstallation', {allEnterpriseInstallPath: ['foo', 'bar']}, true],
    ['installKite', {install: true}, false],
    ['installKite', {install: false}, true],
    ['runKite', {running: true}, false],
    ['runKite', {running: false}, true],
  ].forEach(([method, settings, expected]) => {
    describe(`.${method}()`, () => {
      describe(`when setup with ${JSON.stringify(settings)}`, () => {
        it(`returns ${expected}`, () => {
          expect(testAdapter(settings)[method]()).to.eql(expected);
        });
      });
    });
  });

  [
    ['isAdmin', 'admin'],
    ['isKiteSupported', 'kiteSupported'],
    ['isOSSupported', 'osSupported'],
    ['isOSVersionSupported', 'osVersionSupported'],
  ].forEach(([method, setting]) => {
    describe(`.${method}()`, () => {
      describe(`when setup with ${setting}: true`, () => {
        it('returns true', () => {
          expect(testAdapter({[setting]: true})[method]()).to.be.ok();
        });
      });

      describe(`when setup with ${setting}: false`, () => {
        it('returns false', () => {
          expect(testAdapter({[setting]: false})[method]()).not.to.be.ok();
        });
      });
    });
  });

  [
    ['downloadKite', 'canDownload'],
    ['isKiteInstalled', 'install'],
    ['isKiteRunning', 'running'],
    ['runKiteEnterprise', 'canRunEnterprise'],
    ['isKiteEnterpriseInstalled', 'installEnterprise'],
    ['isKiteEnterpriseRunning', 'runningEnterprise'],
  ].forEach(([method, setting]) => {
    describe(`.${method}()`, () => {
      describe(`when setup with ${setting}: true`, () => {
        it('returns a resolved promise', () => {
          return waitsForPromise(() => testAdapter({[setting]: true})[method]());
        });
      });

      describe(`when setup with ${setting}: false`, () => {
        it('returns a rejected promise', () => {
          return waitsForPromise({shouldReject: true}, () => testAdapter({[setting]: false})[method]());
        });
      });
    });
  });

  describe('.hasBothKiteInstalled()', () => {
    describe('when setup with only install: true', () => {
      it('returns a rejected promise', () => {
        return waitsForPromise({shouldReject: true},
          () => testAdapter({install: true}).hasBothKiteInstalled());
      });
    });

    describe('when setup with only installEnterprise: true', () => {
      it('returns a rejected promise', () => {
        return waitsForPromise({shouldReject: true},
          () => testAdapter({installEnterprise: true}).hasBothKiteInstalled());
      });
    });

    describe('when setup with both install: true and installEnterprise: true', () => {
      it('returns a resolved promise', () => {
        return waitsForPromise(() =>
          testAdapter({installEnterprise: true, install: true}).hasBothKiteInstalled());
      });
    });
  });
});
