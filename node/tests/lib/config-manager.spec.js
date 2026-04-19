import fs from 'fs-extra';
import * as configManager from '../../src/lib/config-manager.js';
import { options } from '../../src/config/constants.js';

vi.mock('fs-extra');

describe('config manager', () => {
  const mockOptions = {
    [options.API_KEY]: 'key0',
    [options.API_SECRET]: 'secret0'
  };

  describe('read', () => {
    describe('when config file exists', () => {
      beforeEach(() => {
        vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockOptions));
        vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      });

      it('should try to read from disk', () => {
        const options = configManager.read();

        expect(fs.readFileSync).toBeCalled();
        expect(options).toEqual(mockOptions);
      });

      it('should throw when json is malformed', () => {
        vi.spyOn(fs, 'readFileSync').mockReturnValue('not-a-json');
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
        vi.spyOn(fs, 'existsSync').mockReturnValue(false);
        vi.spyOn(fs, 'readFileSync');
      });

      it('should not try to read from disk', () => {
        expect(fs.readFileSync).not.toBeCalled();
      });
    });
  });

  describe('write', () => {
    it('should write ONLY required options to disk', () => {
      configManager.write({ ...mockOptions, another: 'option', 'and-another': 'option' });

      expect(fs.outputJsonSync).toHaveBeenCalledWith(expect.any(String), mockOptions, { spaces: 2 });
    });
  });
});
