const DeployUtils = require('../../src/lib/deploy-utils');
const destroy = require('../../src/commands/destroy');
const { options } = require('../../src/config/constants');

const mockGetEnvironment = jest.fn();
const mockUpdateEnvironment = jest.fn();
const mockDestroyEnvironment = jest.fn();
const mockPollDeploymentStatus = jest.fn();

jest.mock('../../src/lib/logger');
jest.mock('../../src/lib/deploy-utils');

const mockDeployment = { id: 'id0' };

const { ENVIRONMENT_NAME, REQUIRES_APPROVAL } = options;

describe('destroy', () => {
  beforeEach(() => {
    DeployUtils.mockImplementation(() => {
      return {
        getEnvironment: mockGetEnvironment,
        updateEnvironment: mockUpdateEnvironment,
        destroyEnvironment: mockDestroyEnvironment,
        pollDeploymentStatus: mockPollDeploymentStatus,
        assertDeploymentStatus: jest.fn()
      };
    });
  });

  it('should call api with proper data', async () => {
    const mockEnvironment = { id: 'something', name: 'someone' };

    mockGetEnvironment.mockResolvedValue(mockEnvironment);
    mockDestroyEnvironment.mockResolvedValue(mockDeployment);

    await destroy({});

    expect(mockDestroyEnvironment).toBeCalledWith(mockEnvironment);
    expect(mockPollDeploymentStatus).toBeCalledWith(mockDeployment);
  });

  it('should fail when environment doesnt exist', async () => {
    const mockEnvironmentName = 'environment0';
    mockGetEnvironment.mockResolvedValue(undefined);

    await expect(destroy({ [ENVIRONMENT_NAME]: mockEnvironmentName })).rejects.toThrow(
      Error,
      `Could not find an environment with the name ${mockEnvironmentName}`
    );
  });

  describe('requires approval argument', () => {
    it.each`
      option       | existing
      ${'true'}    | ${true}
      ${'false'}   | ${false}
      ${undefined} | ${''}
    `('should not call update environment', async ({ option, existing }) => {
      mockGetEnvironment.mockResolvedValue({ requiresApproval: existing });
      mockDestroyEnvironment.mockResolvedValue({ id: 'deployment0' });

      await destroy({ [REQUIRES_APPROVAL]: option });

      expect(mockUpdateEnvironment).not.toBeCalled();
    });

    it.each`
      option     | existing | expected
      ${'true'}  | ${false} | ${true}
      ${'false'} | ${true}  | ${false}
    `('should call update environment', async ({ option, existing, expected }) => {
      mockGetEnvironment.mockResolvedValue({ requiresApproval: existing });
      mockDestroyEnvironment.mockResolvedValue({ id: 'deployment0' });

      await destroy({ [REQUIRES_APPROVAL]: option });

      expect(mockUpdateEnvironment).toBeCalledWith(expect.anything(), { requiresApproval: expected });
    });
  });
});
