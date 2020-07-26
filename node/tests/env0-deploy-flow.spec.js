const DeployUtils = require("../src/env0-deploy-utils");
const runDeployment = require("../src/env0-deploy-flow");

jest.mock("../src/env0-deploy-utils");

const mockRequiredOptions = {
  projectId: 'proj0',
  organizationId: 'org0',
  apiKey: 'key0',
  apiSecret: 'secret0'
};

describe("env0-deploy-flow", () => {
  const deployUtilsMock = DeployUtils.mock.instances[0];

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('when there are missing required options', () => {
    it('should fail with proper error message', () => {
      expect(runDeployment('deploy', {})).rejects.toThrow(expect.stringContaining('Missing required options'));
    })
  });

  describe("when all required options exist", () => {
    const environmentId = 12345;

    describe('deploy', () => {
      it("should fail when it fails to set configuration", async () => {
        const configError = "Configuration error";
        deployUtilsMock.getEnvironment.mockResolvedValue({ id: environmentId });
        deployUtilsMock.pollEnvironmentStatus.mockResolvedValue("ACTIVE");
        deployUtilsMock.setConfiguration.mockRejectedValue(new Error(configError));

        expect(runDeployment('deploy', mockRequiredOptions, { name: "shoes", value: "socks " })).rejects.toThrow(configError);
      });

      it("should throw exception when environment status is FAILED", async () => {
        deployUtilsMock.getEnvironment.mockResolvedValue({ id: environmentId });
        deployUtilsMock.pollEnvironmentStatus.mockResolvedValue("FAILED");

        expect(runDeployment('deploy')).rejects.toThrow(`Environment ${environmentId} did not reach ACTIVE status`);
      });
    })
  });
});
