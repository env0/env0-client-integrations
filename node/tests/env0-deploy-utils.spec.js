const DeployUtils = require("../env0-deploy-utils");
const Env0ApiClient = require("../api-client");

jest.mock("../api-client");

describe("env0-deploy-utils", () => {
  const deployUtils = new DeployUtils();

  describe("pollEnvironmentStatus", () => {
    it("should return last environment status", async () => {
      const mockStatus = "FAILED";
      Env0ApiClient.mock.instances[0].callApi.mockResolvedValue({ status: mockStatus });
      const returnedStatus = await deployUtils.pollEnvironmentStatus(12345);
      expect(returnedStatus).toEqual(mockStatus);
    });
  });
});
