'use strict';

const {KiteConnector} = require('../../lib');
const testAdapter = require('../../lib/support/test-adapter');
const TestClient = require('../../lib/clients/test-client');
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

  // return the call to this function to generate the test case description
  const finalize = () => `with kite ${join(states)}`;

  // We want to make setup as simple as possible, by only setting
  // running we're also saying "kite is installed on a supported platform"
  if (setup.running != undefined && setup.installed == undefined) { setup.installed = true; }
  if (setup.installed != undefined && setup.supported == undefined) { setup.supported = true; }

  // We're building the description by walking through the meaningful
  // states in the option, we return quickly to avoid cluttered descriptions
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
    let safeAdapter, safeClient;
    beforeEach(() => {
      safeAdapter = KiteConnector.adapter;
      safeClient = KiteConnector.client;

      KiteConnector.adapter = testAdapter(setup);
      KiteConnector.client = new TestClient();

      if (setup) {
        KiteConnector.client.addRoute([
          o => true,
          o => { throw new Error(); },
        ]);
      }
    });

    afterEach(() => {
      KiteConnector.adapter = safeAdapter;
      KiteConnector.client = safeClient;
    });

    block();
  });
}

module.exports = {withKite};
