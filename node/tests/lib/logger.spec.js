const logger = require('../../src/lib/logger');
const { options } = require('../../src/config/constants');

global.console = {
  log: jest.fn()
};

const mockSecret = 'TopSecret';
const secureSecret = '**********';

describe('logger', () => {
  it.each`
    option
    ${options.API_KEY}
    ${options.API_SECRET}
  `('should hide $option', ({ option }) => {
    logger.setSecrets({ [option]: mockSecret });

    logger.info(`${option}: ${mockSecret} ${option}: ${mockSecret}`);

    expect(console.log).toBeCalledWith(`${option}: ${secureSecret} ${option}: ${secureSecret}`);
  });

  it.each`
    option
    ${options.ENVIRONMENT_NAME}
    ${options.PROJECT_ID}
    ${options.ORGANIZATION_ID}
    ${options.TEMPLATE_ID}
  `('should not hide $option', ({ option }) => {
    logger.setSecrets({ [option]: mockSecret });

    logger.info(`${option}: ${mockSecret}`);

    expect(console.log).toBeCalledWith(`${option}: ${mockSecret}`);
  });
});
