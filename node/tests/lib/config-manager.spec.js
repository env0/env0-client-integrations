const fs = require('fs-extra');
const configManager = require('../../src/lib/config-manager');
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

        delete process.env.ENV0_API_KEY;
      });

      it('env vars should take precedence over cli parameters + config file', () => {
        const envKey = 'key1';
        process.env.ENV0_API_KEY = envKey;

        const config = configManager.read({ [options.API_KEY]: 'key2' });

        expect(config).toEqual({ ...mockOptions, [options.API_KEY]: envKey });

        delete process.env.ENV0_API_KEY;
      });
    });

    describe('when config file does not exist', () => {
      beforeEach(() => {
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      });

      it('should not try to read from disk', () => {
        expect(fs.readFileSync).not.toBeCalled();
      });

      it('env vars should take precedence over cli parameters', () => {
        const envKey = 'envKey';
        process.env.ENV0_API_KEY = envKey;

        const config = configManager.read({ [options.API_KEY]: 'paramKey' });

        expect(config).toEqual({ [options.API_KEY]: envKey });

        delete process.env.ENV0_API_KEY;
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
