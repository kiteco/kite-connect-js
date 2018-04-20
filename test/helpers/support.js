'use strict';

const {KiteConnector} = require('../../lib');
const testAdapter = require('../../lib/support/test-adapter');
const {deepMerge} = require('../../lib/utils');

const DEFAULT_SETUP = {
  supported: true,
  installed: true,
  running: true,
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
  const finalize = () => `with kite ${join(states)}`;

  states.push(setup.supported ? 'supported' : 'not supported');
  if (!setup.supported) { return finalize(); }

  states.push(setup.installed ? 'installed' : 'not installed');
  if (!setup.installed) { return finalize(); }

  states.push(setup.running ? 'running' : 'not running');
  if (!setup.running) { return finalize(); }

  return finalize();
}

function withKite(setup, block) {
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

module.exports = {withKite};
