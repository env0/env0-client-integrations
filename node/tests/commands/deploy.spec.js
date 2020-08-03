const deploy = require('../../src/commands/deploy');
const DeployUtils = require('../../src/lib/deploy-utils');
const { options } = require('../../src/config/constants');

const { REQUIRES_APPROVAL } = options;

const mockGetEnvironment = jest.fn();
const mockCreateEnvironment = jest.fn();
const mockDeployEnvironment = jest.fn();

jest.mock('../../src/lib/deploy-utils');

describe('deploy', () => {
  beforeEach(() => {
    DeployUtils.mockImplementation(() => ({
      getEnvironment: mockGetEnvironment,
      createEnvironment: mockCreateEnvironment,
      deployEnvironment: mockDeployEnvironment,
      pollDeploymentStatus: jest.fn(),
      assertDeploymentStatus: jest.fn()
    }));
  });

  describe('requires approval argument', () => {
    it.each`
      requiresApproval | expected
      ${'true'}        | ${true}
      ${'false'}       | ${false}
      ${undefined}     | ${undefined}
    `('should process requires approval argument properly', async ({ requiresApproval, expected }) => {
      mockDeployEnvironment.mockResolvedValue({ id: 'deployment0' });
      await deploy({ [REQUIRES_APPROVAL]: requiresApproval });

      expect(mockDeployEnvironment).toBeCalledWith(undefined, undefined, undefined, expected);
    });
  });
});
