'use strict';

const {waitsForPromise} = require('../helpers/async');
const NoSupportAdapter = require('../../lib/support/no-support');

describe('No Support', () => {
  describe('.isKiteInstalled()', () => {
    it('returns a rejected promise', () => {
      return waitsForPromise({
        shouldReject: true,
      }, () => NoSupportAdapter.isKiteInstalled());
    });
  });

  describe('.isKiteEnterpriseInstalled()', () => {
    it('returns a rejected promise', () => {
      return waitsForPromise({
        shouldReject: true,
      }, () => NoSupportAdapter.isKiteInstalled());
    });
  });

  describe('.installKite()', () => {
    it('returns a rejected promise', () => {
      return waitsForPromise({
        shouldReject: true,
      }, () => NoSupportAdapter.installKite());
    });
  });

  describe('.isKiteRunning()', () => {
    it('returns a rejected promise', () => {
      return waitsForPromise({
        shouldReject: true,
      }, () => NoSupportAdapter.isKiteRunning());
    });
  });

  describe('.runKite()', () => {
    it('returns a rejected promise', () => {
      return waitsForPromise({
        shouldReject: true,
      }, () => NoSupportAdapter.runKite());
    });
  });

  describe('.isKiteEnterpriseRunning()', () => {
    it('returns a rejected promise', () => {
      return waitsForPromise({
        shouldReject: true,
      }, () => NoSupportAdapter.isKiteRunning());
    });
  });

  describe('.runKiteEnterprise()', () => {
    it('returns a rejected promise', () => {
      return waitsForPromise({
        shouldReject: true,
      }, () => NoSupportAdapter.runKite());
    });
  });
});
