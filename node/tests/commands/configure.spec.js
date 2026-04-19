import configure from '../../src/commands/configure.js';
import * as configManager from '../../src/lib/config-manager.js';
import { input } from '@inquirer/prompts';
import logger from '../../src/lib/logger.js';

vi.mock('@inquirer/prompts', () => ({
  input: vi.fn()
}));
vi.mock('../../src/lib/config-manager.js', () => ({
  INCLUDED_OPTIONS: ['apiKey', 'apiSecret', 'organizationId', 'projectId', 'blueprintId', 'environmentName'],
  read: vi.fn(),
  write: vi.fn()
}));
vi.mock('../../src/lib/logger.js');

describe('configure', () => {
  describe('interactive configure', () => {
    beforeEach(() => {
      input
        .mockResolvedValueOnce('first')
        .mockResolvedValueOnce('second')
        .mockResolvedValueOnce('')
        .mockResolvedValueOnce('')
        .mockResolvedValueOnce('')
        .mockResolvedValueOnce('');
    });

    beforeEach(async () => {
      await configure({});
    });

    it('should remove empty answers', () => {
      expect(configManager.write).toHaveBeenCalledWith({ apiKey: 'first', apiSecret: 'second' });
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
      expect(configManager.read).toHaveBeenCalledWith(options);
    });

    it('should write the merged configuration', () => {
      expect(configManager.write).toHaveBeenCalledWith(mockedMergedOptions);
    });

    it('should log each new option written to configuration', () => {
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('first: first'));
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('second: second'));
    });

    it('should not log existing configuration', () => {
      expect(logger.info).not.toHaveBeenCalledWith(expect.stringContaining('third'));
    });
  });
});
