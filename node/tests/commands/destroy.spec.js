const DeployUtils = require('../../src/lib/deploy-utils');
const destroy = require('../../src/commands/destroy');
const { options } = require('../../src/config/constants');

const mockGetEnvironment = jest.fn();
const mockUpdateEnvironment = jest.fn();
const mockDestroyEnvironment = jest.fn();

jest.mock('../../src/lib/deploy-utils');

const { ENVIRONMENT_NAME, REQUIRES_APPROVAL } = options;

describe('destroy', () => {
  beforeEach(() => {
    DeployUtils.mockImplementation(() => {
      return {
        getEnvironment: mockGetEnvironment,
        updateEnvironment: mockUpdateEnvironment,
        destroyEnvironment: mockDestroyEnvironment,
        pollDeploymentStatus: jest.fn(),
        assertDeploymentStatus: jest.fn()
      };
    });
  });

  it('should fail when environment doesnt exist', async () => {
    const options = { [ENVIRONMENT_NAME]: 'environment0' };
    mockGetEnvironment.mockResolvedValue(undefined);

    await expect(destroy(options)).rejects.toThrow(Error, `Could not find an environment with the name environment0`);
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
