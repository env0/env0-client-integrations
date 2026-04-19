import DeployUtils from '../../src/lib/deploy-utils.js';
import destroy from '../../src/commands/destroy.js';
import { options } from '../../src/config/constants.js';

const mockGetEnvironment = vi.fn();
const mockUpdateEnvironment = vi.fn();
const mockDestroyEnvironment = vi.fn();
const mockPollDeploymentStatus = vi.fn();

vi.mock('../../src/lib/logger.js');
vi.mock('../../src/lib/deploy-utils.js');

const mockDeployment = { id: 'id0' };

const { ENVIRONMENT_NAME, REQUIRES_APPROVAL, SKIP_STATE_REFRESH, CHECKOUT_UPDATED_CODE } = options;

describe('destroy', () => {
  beforeEach(() => {
    DeployUtils.mockImplementation(function () {
      this.getEnvironment = mockGetEnvironment;
      this.updateEnvironment = mockUpdateEnvironment;
      this.destroyEnvironment = mockDestroyEnvironment;
      this.pollDeploymentStatus = mockPollDeploymentStatus;
      this.assertDeploymentStatus = vi.fn();
    });
  });

  it('should call api with proper data', async () => {
    const mockEnvironment = { id: 'something', name: 'someone' };

    mockGetEnvironment.mockResolvedValue(mockEnvironment);
    mockDestroyEnvironment.mockResolvedValue(mockDeployment);

    await destroy({});

    expect(mockDestroyEnvironment).toHaveBeenCalledWith(mockEnvironment, expect.anything());
    expect(mockPollDeploymentStatus).toHaveBeenCalledWith(mockDeployment);
  });

  it("should fail when environment doesn't exist", async () => {
    const mockEnvironmentName = 'environment0';
    mockGetEnvironment.mockResolvedValue(undefined);

    await expect(destroy({ [ENVIRONMENT_NAME]: mockEnvironmentName })).rejects.toThrow(
      Error,
      `Could not find an environment with the name ${mockEnvironmentName}`
    );
  });

  describe('skipStateRefresh argument', () => {
    it.each`
      options
      ${{ [SKIP_STATE_REFRESH]: 'true' }}
      ${{ [SKIP_STATE_REFRESH]: 'false' }}
      ${{}}
    `('should call destroyEnvironment with skipStateRefresh Option, options=$options', async ({ options }) => {
      const mockEnvironment = { id: 'something', name: 'someone' };
      mockGetEnvironment.mockResolvedValue(mockEnvironment);

      await destroy(options);
      expect(mockDestroyEnvironment).toHaveBeenCalledWith(expect.anything(), options);
    });
  });

  describe('checkoutUpdatedCode argument', () => {
    it.each`
      options
      ${{ [CHECKOUT_UPDATED_CODE]: 'true' }}
      ${{ [CHECKOUT_UPDATED_CODE]: 'false' }}
      ${{}}
    `('should call destroyEnvironment with checkoutUpdatedCode Option, options=$options', async ({ options }) => {
      const mockEnvironment = { id: 'something', name: 'someone' };
      mockGetEnvironment.mockResolvedValue(mockEnvironment);

      await destroy(options);
      expect(mockDestroyEnvironment).toHaveBeenCalledWith(expect.anything(), options);
    });
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

      expect(mockUpdateEnvironment).toHaveBeenCalledWith(expect.anything(), { [REQUIRES_APPROVAL]: expected });
    });
  });
});
