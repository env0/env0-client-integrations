const DeployUtils = require("../src/env0-deploy-utils");
const runDeployment = require("../src/env0-deploy-flow");
const persistedOptions = require('../src/commons/persisted-options');
const { OPTIONS } = require('../src/commons/constants');

jest.mock("../src/env0-deploy-utils");
jest.mock('../src/commons/persisted-options');

const { API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID } = OPTIONS;

const mockRequiredOptions = {
  [PROJECT_ID]: 'proj0',
  [ORGANIZATION_ID]: 'org0',
  [API_KEY]: 'key0',
  [API_SECRET]: 'secret0'
};

describe("env0-deploy-flow", () => {
  const deployUtilsMock = DeployUtils.mock.instances[0];
  const environmentId = 12345;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(persistedOptions, 'read').mockReturnValue({});
  });

  beforeEach(() => {
    deployUtilsMock.getEnvironment.mockResolvedValue({ id: environmentId });
    deployUtilsMock.pollEnvironmentStatus.mockResolvedValue("ACTIVE");
  })

  it('should read and write persisted options', async () => {
    await runDeployment('deploy', mockRequiredOptions);

    expect(persistedOptions.read).toBeCalled();
    expect(persistedOptions.write).toBeCalled();
  })

  describe('when there are missing required options', () => {
    it('should fail with proper error message', () => {
      expect(runDeployment('deploy', {})).rejects.toThrow(expect.stringContaining('Missing required options'));
    })
  });

  describe("when all required options exist", () => {
    describe('deploy', () => {

      it("should fail when it fails to set configuration", async () => {
        const configError = "Configuration error";
        deployUtilsMock.setConfiguration.mockRejectedValue(new Error(configError));

        expect(runDeployment('deploy', mockRequiredOptions, { name: "shoes", value: "socks " })).rejects.toThrow(configError);
      });

      it("should throw exception when environment status is FAILED", async () => {
        deployUtilsMock.pollEnvironmentStatus.mockResolvedValue("FAILED");

        expect(runDeployment('deploy')).rejects.toThrow(`Environment ${environmentId} did not reach ACTIVE status`);
      });

      it('should use parameters with precedence over existing config', async () => {
        jest.spyOn(persistedOptions, 'read').mockReturnValue({ [API_KEY]: 'key1', [API_SECRET]: 'secret1' });

        await runDeployment('deploy', mockRequiredOptions);

        expect(DeployUtils.init).toBeCalledWith(mockRequiredOptions);
      })
    })
  });
});
