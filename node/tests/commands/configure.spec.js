const configure = require('../../src/commands/configure');
const configManager = require('../../src/lib/config-manager');
const inquirer = require('inquirer');
const logger = require('../../src/lib/logger');

jest.mock('inquirer');
jest.mock('../../src/lib/config-manager');
jest.mock('../../src/lib/logger');

describe('configure', () => {
  describe('interactive configure', () => {
    beforeEach(() => {
      jest
        .spyOn(inquirer, 'prompt')
        .mockResolvedValue({ first: 'first', second: 'second', empty1: '', empty2: null, empty3: undefined });
    });

    beforeEach(async () => {
      await configure({});
    });

    it('should remove empty answers', () => {
      expect(configManager.write).toBeCalledWith({ first: 'first', second: 'second' });
    });
  });

  describe('non-interactive configure', () => {
    const options = { first: 'first', second: 'second' };
    const mockedMergedOptions = { ...options, third: 'third' };
    beforeEach(async () => {
      configManager.read.mockReturnValue(mockedMergedOptions);

      await configure(options);
    });

    it('should read configuration and merge with input options', () => {
      expect(configManager.read).toBeCalledWith(options);
    });

    it('should write the merged configuration', () => {
      expect(configManager.write).toBeCalledWith(mockedMergedOptions);
    });

    it('should log each new option written to configuration', () => {
      expect(logger.info).toBeCalledWith(expect.stringContaining('first: first'));
      expect(logger.info).toBeCalledWith(expect.stringContaining('second: second'));
    });

    it('should not log existing configuration', () => {
      expect(logger.info).not.toBeCalledWith(expect.stringContaining('third'));
    });
  });
});
