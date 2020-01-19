const DeployUtils = require("../env0-deploy-utils");
const runDeployment = require("../env0-deploy-flow");

jest.mock("../env0-deploy-utils");

describe("env0-deploy-flow", () => {
  const deployUtilsMock = DeployUtils.mock.instances[0];
  describe("deploy", () => {
    const environmentId = 12345;

    beforeEach(() => {
      jest.resetAllMocks();
    });

    it("should fail when it fails to set configuration", async () => {
      const configError = "Configuration error";
      deployUtilsMock.getEnvironment.mockResolvedValue({ id: environmentId });
      deployUtilsMock.pollEnvironmentStatus.mockResolvedValue("ACTIVE");
      deployUtilsMock.setConfiguration.mockRejectedValue(new Error(configError));

      return expect(
        runDeployment({ action: "deploy" }, [{ name: "shoes", value: "socks " }])
      ).rejects.toThrow(configError);
    });

    it("should throw exception when environment status is FAILED", async () => {
      deployUtilsMock.getEnvironment.mockResolvedValue({ id: environmentId });
      deployUtilsMock.pollEnvironmentStatus.mockResolvedValue("FAILED");

      return expect(runDeployment({ action: "deploy" })).rejects.toThrow(
        `Environment ${environmentId} did not reach ACTIVE status`
      );
    });
  });
});
