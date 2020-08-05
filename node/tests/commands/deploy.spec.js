const deploy = require('../../src/commands/deploy');
const DeployUtils = require('../../src/lib/deploy-utils');
const { options } = require('../../src/config/constants');

const { ENVIRONMENT_NAME, PROJECT_ID, ORGANIZATION_ID, BLUEPRINT_ID } = options;

const mockOptions = {
  [PROJECT_ID]: 'project0',
  [ENVIRONMENT_NAME]: 'environment0',
  [ORGANIZATION_ID]: 'organization0',
  [BLUEPRINT_ID]: 'blueprint0'
};

const mockGetEnvironment = jest.fn();
const mockCreateEnvironment = jest.fn();
const mockDeployEnvironment = jest.fn();

jest.mock('../../src/lib/deploy-utils');
jest.mock('../../src/lib/logger');

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

  beforeEach(() => {
    mockDeployEnvironment.mockResolvedValue({ id: 'deployment0' });
  });

  it('should get environment', async () => {
    await deploy(mockOptions);

    expect(mockGetEnvironment).toBeCalledWith(mockOptions[ENVIRONMENT_NAME], mockOptions[PROJECT_ID]);
  });

  it("should create environment when it doesn't exist", async () => {
    mockGetEnvironment.mockResolvedValue(undefined);

    await deploy(mockOptions);
    expect(mockCreateEnvironment).toBeCalledWith(
      mockOptions[ENVIRONMENT_NAME],
      mockOptions[ORGANIZATION_ID],
      mockOptions[PROJECT_ID]
    );
  });
});
