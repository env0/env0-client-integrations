import runCommand from '../../src/commands/run-command.js';
import * as configManager from '../../src/lib/config-manager.js';
import { options } from '../../src/config/constants.js';
import deploy from '../../src/commands/deploy.js';
import destroy from '../../src/commands/destroy.js';
import approve from '../../src/commands/approve.js';
import cancel from '../../src/commands/cancel.js';

vi.mock('../../src/commands/deploy.js');
vi.mock('../../src/commands/destroy.js');
vi.mock('../../src/commands/approve.js');
vi.mock('../../src/commands/cancel.js');
vi.mock('../../src/lib/deploy-utils.js');
vi.mock('../../src/lib/config-manager.js');

const { API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID, ENVIRONMENT_NAME, REQUIRES_APPROVAL } = options;

const mockRequiredOptions = {
  [PROJECT_ID]: 'proj0',
  [ORGANIZATION_ID]: 'org0',
  [API_KEY]: 'key0',
  [API_SECRET]: 'secret0',
  [ENVIRONMENT_NAME]: 'env0'
};

describe('run command', () => {
  beforeEach(() => {
    configManager.read.mockReturnValue(mockRequiredOptions);
  });

  describe('configuration', () => {
    beforeEach(async () => {
      await runCommand('deploy', mockRequiredOptions);
    });

    it('should read configuration and merge with input options', async () => {
      expect(configManager.read).toHaveBeenCalledWith(mockRequiredOptions);
    });

    it('should not overwrite configuration', async () => {
      expect(configManager.write).not.toBeCalled();
    });
  });

  describe('when there are missing required options', () => {
    it('should fail with proper error message', async () => {
      configManager.read.mockReturnValue({});
      await expect(runCommand('deploy', {})).rejects.toThrow(
        expect.objectContaining({ message: expect.stringContaining('Missing required options') })
      );
    });
  });

  describe('requires approval argument', () => {
    it.each`
      requiresApprovalValue
      ${'true'}
      ${'false'}
      ${undefined}
    `(
      'should succeed when requires approval argument has a value of $requiresApprovalValue',
      async ({ requiresApprovalValue }) => {
        const options = { ...mockRequiredOptions, [REQUIRES_APPROVAL]: requiresApprovalValue };
        configManager.read.mockReturnValue(options);

        await runCommand('deploy', options);
      }
    );

    it('should fail when requires approval argument has an invalid value', async () => {
      const options = { ...mockRequiredOptions, [REQUIRES_APPROVAL]: 'something' };
      configManager.read.mockReturnValue(options);

      await expect(runCommand('deploy', options)).rejects.toThrow(
        expect.objectContaining({ message: expect.stringContaining('Bad argument') })
      );
    });
  });

  describe('when all required options exist', () => {
    describe.each`
      command      | mock
      ${'deploy'}  | ${deploy}
      ${'destroy'} | ${destroy}
      ${'approve'} | ${approve}
      ${'cancel'}  | ${cancel}
    `('when command is $command', ({ command, mock }) => {
      beforeEach(async () => {
        await runCommand(command, mockRequiredOptions);
      });

      it('should call proper callback', () => {
        expect(mock).toHaveBeenCalledWith(mockRequiredOptions, undefined);
      });
    });
  });
});
