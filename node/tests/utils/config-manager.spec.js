const fs = require('fs-extra');
const configManager = require('../../src/utils/config-manager');
const { options } = require('../../src/config/constants');

jest.mock('fs-extra');

describe('config manager', () => {
  const mockOptions = {
    [options.API_KEY]: 'key0',
    [options.API_SECRET]: 'secret0'
  };

  describe('read', () => {
    describe('when config file exists', () => {
      beforeEach(() => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockOptions));
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      });

      it('should try to read from disk', () => {
        const options = configManager.read();

        expect(fs.readFileSync).toBeCalled();
        expect(options).toEqual(mockOptions);
      });

      it('should throw when json is malformed', () => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue('not-a-json');
        expect(() => configManager.read()).toThrow();
      });

      it('env vars should take precedence over config file', () => {
        const anotherApiKey = 'key1';
        process.env.ENV0_API_KEY = anotherApiKey;

        const config = configManager.read();

        expect(config).toEqual({ ...mockOptions, [options.API_KEY]: anotherApiKey });
      });

      it('cli parameters should take precedence over env vars + config file', async () => {
        const expectedKey = 'key2';
        process.env.ENV0_API_KEY = 'key1';

        const config = configManager.read({ [options.API_KEY]: expectedKey });

        expect(config).toEqual({ ...mockOptions, [options.API_KEY]: expectedKey });
      });
    });

    describe('when config file does not exist', () => {
      beforeEach(() => {
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      });

      it('should not try to read from disk', () => {
        expect(fs.readFileSync).not.toBeCalled();
      });
    });
  });

  describe('write', () => {
    it('should write ONLY required options to disk', () => {
      configManager.write({ ...mockOptions, another: 'option', 'and-another': 'option' });

      expect(fs.outputJsonSync).toBeCalledWith(expect.any(String), mockOptions, { spaces: 2 });
    });
  });
});
