'use strict';

const {KiteConnector} = require('../../lib');
const testAdapter = require('../../lib/support/test-adapter');
const {deepMerge} = require('../../lib/utils');

const DEFAULT_SETUP = {
  install: true,
  running: true,
  kiteSupported: true,
  osSupported: true,
  osVersionSupported: true,
};

function join(arr) {
  return arr.reduce((m, v, i, a) => {
    if (m === '') {
      return v;
    } else if (i === a.length - 1) {
      return `${m} and ${v}`;
    } else {
      return `${m}, ${v}`;
    }
  }, '');
}

function setupDescription(setup) {
  const states = [];

  states.push(setup.install ? 'installed' : 'not installed');
  states.push(setup.running ? 'running' : 'not running');

  return `with kite ${join(states)}`;
}

function withSetup(setup, block) {
  setup = deepMerge(DEFAULT_SETUP, setup);

  describe(setupDescription(setup), () => {
    let safeAdapter;
    beforeEach(() => {
      safeAdapter = KiteConnector.adapter;
      KiteConnector.adapter = testAdapter(setup);
    });

    afterEach(() => {
      KiteConnector.adapter = safeAdapter;
    });

    block();
  });
}

module.exports = {withSetup};
