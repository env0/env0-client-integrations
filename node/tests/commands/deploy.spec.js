const deploy = require('../../src/commands/deploy');
const DeployUtils = require('../../src/lib/deploy-utils');
const { options } = require('../../src/config/constants');

const { ENVIRONMENT_NAME, PROJECT_ID, ORGANIZATION_ID, BLUEPRINT_ID, REVISION, WORKSPACE_NAME } = options;

const mockOptions = {
  [PROJECT_ID]: 'project0',
  [ENVIRONMENT_NAME]: 'environment0',
  [ORGANIZATION_ID]: 'organization0'
};

const mockOptionsWithRequired = {
  ...mockOptions,
  [WORKSPACE_NAME]: 'workspace0',
  [BLUEPRINT_ID]: 'blueprint0',
  [REVISION]: 'revision0'
};

const mockGetEnvironment = jest.fn();
const mockCreateAndDeployEnvironment = jest.fn();
const mockDeployEnvironment = jest.fn();
const mockPollDeploymentStatus = jest.fn();

jest.mock('../../src/lib/deploy-utils');
jest.mock('../../src/lib/logger');

const mockDeployment = { id: 'id0' };
const mockEnvironment = { id: 'environment0', latestDeploymentLog: mockDeployment };

describe('deploy', () => {
  beforeEach(() => {
    DeployUtils.mockImplementation(() => ({
      getEnvironment: mockGetEnvironment,
      createAndDeployEnvironment: mockCreateAndDeployEnvironment,
      deployEnvironment: mockDeployEnvironment,
      pollDeploymentStatus: mockPollDeploymentStatus,
      assertDeploymentStatus: jest.fn()
    }));
  });

  beforeEach(() => {
    mockDeployEnvironment.mockResolvedValue(mockDeployment);
    mockCreateAndDeployEnvironment.mockResolvedValue(mockEnvironment);
  });

  it('should get environment', async () => {
    await deploy(mockOptionsWithRequired);

    expect(mockGetEnvironment).toBeCalledWith(mockOptions[ENVIRONMENT_NAME], mockOptions[PROJECT_ID]);
  });

  it("should create environment when it doesn't exist", async () => {
    mockGetEnvironment.mockResolvedValue(undefined);

    await deploy(mockOptionsWithRequired);
    expect(mockCreateAndDeployEnvironment).toBeCalledWith(mockOptionsWithRequired, []);
  });

  describe('proper set of configuration changes', () => {
    const variables = [
      {
        name: 'foo',
        value: 'bar',
        sensitive: false,
        type: 0
      },
      {
        name: 'baz',
        value: 'waldo',
        sensitive: true,
        type: 0
      },
      {
        name: 'cal',
        value: 'bears',
        sensitive: false,
        type: 1
      }
    ];

    const expectedConfigurationChanges = variables.map(variable => ({
      name: variable.name,
      value: variable.value,
      isSensitive: variable.sensitive,
      type: variable.type
    }));

    it('on initial deploy', async () => {
      mockGetEnvironment.mockResolvedValue(undefined);

      await deploy(mockOptionsWithRequired, variables);

      expect(mockCreateAndDeployEnvironment).toBeCalledWith(mockOptionsWithRequired, expectedConfigurationChanges);
    });

    it('should redeploy with arguments', async () => {
      mockGetEnvironment.mockResolvedValue(mockEnvironment);
      const redeployOptions = { ...mockOptionsWithRequired, [WORKSPACE_NAME]: undefined };
      await deploy(redeployOptions, variables);

      expect(mockDeployEnvironment).toBeCalledWith(mockEnvironment, redeployOptions, expectedConfigurationChanges);
      expect(mockPollDeploymentStatus).toBeCalledWith(mockDeployment);
    });

    it('should not allow to redeploy with a different workspace name set', async () => {
      mockGetEnvironment.mockResolvedValue(mockEnvironment);

      await expect(deploy({ [WORKSPACE_NAME]: 'workspace0' }, variables)).rejects.toThrowError(
        'You cannot change a workspace name once an environment has been deployed'
      );
    });

    it('should allow to redeploy with the same workspace name', async () => {
      let existingEnvironmentWithWorkspace = { ...mockEnvironment, [WORKSPACE_NAME]: 'workspace0' };
      mockGetEnvironment.mockResolvedValue(existingEnvironmentWithWorkspace);

      await deploy(mockOptionsWithRequired, variables)

      const expectedOptions = { ...mockOptionsWithRequired }
      delete expectedOptions[WORKSPACE_NAME]

      expect(mockDeployEnvironment).toBeCalledWith(existingEnvironmentWithWorkspace, expectedOptions, expectedConfigurationChanges);
    });
  });

  it('should fail when blueprint is missing on initial deployment', async () => {
    mockGetEnvironment.mockResolvedValue(undefined);

    await expect(deploy(mockOptions)).rejects.toThrow(
      expect.objectContaining({ message: 'Missing blueprint ID on initial deployment' })
    );
  });
});
