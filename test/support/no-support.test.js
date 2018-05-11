'use strict';

const expect = require('expect.js');
const {waitsForPromise} = require('../helpers/async');
const NoSupportAdapter = require('../../lib/support/no-support');

describe('No Support', () => {
  [
    'releaseURL',
    'downloadPath',
    'installPath',
    'allInstallPaths',
    'enterpriseInstallPath',
    'allEnterpriseInstallPaths',
    'sessionFilePath',
  ].forEach(getter => {
    describe(`.${getter}`, () => {
      it('returns null', () => {
        expect(NoSupportAdapter[getter]).to.be(null);
      });
    });
  });

  [
    ['hasManyKiteInstallation', false],
    ['hasManyKiteEnterpriseInstallation', false],
    ['isAdmin', false],
    ['arch', null],
    ['isOSSupported', false],
    ['isOSVersionSupported', false],
    ['isKiteSupported', false],
  ].forEach(([method, expected]) => {
    describe(`.${method}()`, () => {
      it(`returns ${expected}`, () => {
        expect(NoSupportAdapter[method]()).to.eql(expected);
      });
    });
  });

  [
    'isKiteInstalled',
    'downloadKite',
    'installKite',
    'isKiteRunning',
    'runKite',
    'hasBothKiteInstalled',
    'isKiteEnterpriseInstalled',
    'isKiteEnterpriseRunning',
    'runKiteEnterprise',
  ].forEach(method => {
    describe(`.${method}()`, () => {
      it('returns a rejected promise', () => {
        return waitsForPromise({
          shouldReject: true,
        }, () => NoSupportAdapter[method]());
      });
    });
  });

});
