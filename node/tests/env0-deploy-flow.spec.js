const DeployUtils = require("../env0-deploy-utils");
const runDeployment = require("../env0-deploy-flow");

jest.mock("../env0-deploy-utils");

describe("env0-deploy-flow", () => {
  const deployUtilsMock = DeployUtils.mock.instances[0];
  describe("deploy", () => {
    it("should throw exception when environment status is FAILED", async () => {
      const id = 12345;
      deployUtilsMock.getEnvironment.mockResolvedValue({ id });
      deployUtilsMock.pollEnvironmentStatus.mockResolvedValue("FAILED");

      return expect(runDeployment({ action: "deploy" })).rejects.toThrow(
        `Environment ${id} did not reach ACTIVE status`
      );
    });
  });
});
