'use strict';

const expect = require('expect.js');
const sinon = require('sinon');
const logger = require('../lib/logger');
const output = require('../lib/loggers/null');

const allLevels = [0, 1, 2, 3, 4, 5];
const levelNames = [
  'silly',
  'verbose',
  'debug',
  'info',
  'warn',
  'error',
];

describe('KiteLogger', () => {
  let outputStub;

  beforeEach(() => {
    outputStub = sinon.stub(output, 'log');
    logger.output = output;
  });

  afterEach(() => {
    outputStub.restore();
  });

  allLevels.forEach((level) => {
    describe(`for a logging level of ${levelNames[level]}`, () => {
      allLevels.forEach((tested) => {
        if (tested >= level) {
          it(`outputs logs with a level of ${levelNames[tested]}`, () => {
            logger.LEVEL = level;

            logger[levelNames[tested]]('foo');

            expect(output.log.calledWith(tested, 'foo')).to.be.ok();
          });
        } else {
          it(`does not output logs with a level of ${levelNames[tested]}`, () => {
            logger.LEVEL = level;

            logger[levelNames[tested]]('foo');

            expect(output.log.calledWith(tested, 'foo')).not.to.be.ok();
          });
        }
      });
    });
  });

  describe('when the silent mode is enabled', () => {
    beforeEach(() => {
      logger.LEVEL = 0;
      logger.SILENT = true;
    });

    allLevels.forEach((tested) => {
      it(`does not output logs with a level of ${levelNames[tested]}`, () => {
        logger[levelNames[tested]]('foo');

        expect(output.log.calledWith(tested, 'foo')).not.to.be.ok();
      });
    });
  });
});
