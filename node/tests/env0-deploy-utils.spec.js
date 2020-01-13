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

  describe('Setting Configuration', () => {
    it('should query existing configurations for update', async () => {
      const callApiMock = Env0ApiClient.mock.instances[0].callApi;
      callApiMock.mockResolvedValue([]);

      await deployUtils.setConfiguration(
          {id:'environment-1', organizationId: 'organization-1'},
          'blueprint-1',
          'variable-name',
          'variable-value'
      );

      expect(callApiMock).toHaveBeenCalledWith(
          'get',
          'configuration',
          {params: {blueprintId: 'blueprint-1', environmentId: 'environment-1', organizationId: 'organization-1'}}
      );
    });

    it('should post configuration property without id when new', async () => {
      const callApiMock = Env0ApiClient.mock.instances[0].callApi;
      callApiMock.mockResolvedValue([]);

      await deployUtils.setConfiguration(
          {id:'environment-1', organizationId: 'organization-1'},
          'blueprint-1',
          'variable-name',
          'variable-value'
      );

      expect(callApiMock).toHaveBeenCalledWith(
          'post',
          'configuration',
          {
            data: expect.objectContaining({
              isSensitive: false,
              name: 'variable-name',
              organizationId: 'organization-1',
              projectId: undefined,
              scope: "ENVIRONMENT",
              scopeId: 'environment-1',
              type: 0,
              value: "variable-value",
            })
          }
      );
    });
  });
});
