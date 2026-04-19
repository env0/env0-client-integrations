import { Writable } from 'node:stream';
import winston from 'winston';
import logger from '../../src/lib/logger.js';
import { options } from '../../src/config/constants.js';

const mockSecret = 'TopSecret';
const secureSecret = '**********';

const logged = [];
const captureTransport = new winston.transports.Stream({
  stream: new Writable({
    write(chunk, _encoding, callback) {
      logged.push(chunk.toString().trimEnd());
      callback();
    }
  })
});

logger.add(captureTransport);

afterEach(() => {
  logged.length = 0;
});

describe('logger', () => {
  it.each`
    option
    ${options.API_KEY}
    ${options.API_SECRET}
  `('should hide $option', ({ option }) => {
    logger.setSecrets({ [option]: mockSecret });

    logger.info(`${option}: ${mockSecret} ${option}: ${mockSecret}`);

    expect(logged).toContain(`${option}: ${secureSecret} ${option}: ${secureSecret}`);
  });

  it.each`
    option
    ${options.ENVIRONMENT_NAME}
    ${options.PROJECT_ID}
    ${options.ORGANIZATION_ID}
    ${options.BLUEPRINT_ID}
  `('should not hide $option', ({ option }) => {
    logger.setSecrets({ [option]: mockSecret });

    logger.info(`${option}: ${mockSecret}`);

    expect(logged).toContain(`${option}: ${mockSecret}`);
  });
});
