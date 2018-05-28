'use strict';

const expect = require('expect.js');
const sinon = require('sinon');
const ConsoleOutput = require('../../loggers/console');
const levelNames = [
  'silly',
  'verbose',
  'debug',
  'info',
  'warn',
  'error',
];

describe('ConsoleOutput', () => {
  let consoleStub;

  Object.keys(ConsoleOutput.METHODS).forEach(level => {
    const consoleMethod = ConsoleOutput.METHODS[level];

    describe(`when calling log with a level of ${levelNames[level]}`, () => {
      it(`calls the ${consoleMethod} method on the console object`, () => {});
    });
  });
});
