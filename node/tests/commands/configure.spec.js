const configure = require('../../src/commands/configure');
const configManager = require('../../src/lib/config-manager');
const inquirer = require('inquirer');

jest.mock('inquirer');
jest.mock('../../src/lib/config-manager');

describe('configure', () => {
  beforeEach(() => {
    jest
      .spyOn(inquirer, 'prompt')
      .mockResolvedValue({ first: 'first', second: 'second', empty1: '', empty2: null, empty3: undefined });
  });

  it('should remove empty answers', async () => {
    await configure();

    expect(configManager.write).toBeCalledWith({ first: 'first', second: 'second' });
  });
});
