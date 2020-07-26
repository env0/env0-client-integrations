const DeployUtils = require("../src/env0-deploy-utils");
const Env0ApiClient = require("../src/api-client");

jest.mock("../src/api-client");

describe("env0-deploy-utils", () => {
  let callApiMock;
  const deployUtils = new DeployUtils();

  beforeEach(() => {
    callApiMock = Env0ApiClient.mock.instances[0].callApi;
    callApiMock.mockResolvedValue([]);
  })

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
      await deployUtils.setConfiguration(
          {id:'environment-1', organizationId: 'organization-1'},
          'blueprint-1',
          'variable-name',
          'variable-value',
          false
      );

      expect(callApiMock).toHaveBeenCalledWith(
          'get',
          'configuration',
          {params: {blueprintId: 'blueprint-1', environmentId: 'environment-1', organizationId: 'organization-1'}}
      );
    });

    it('should post configuration property without id when new', async () => {
      await deployUtils.setConfiguration(
          {id:'environment-1', organizationId: 'organization-1'},
          'blueprint-1',
          'variable-name',
          'variable-value',
          false
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

    it.each`
    isSensitive
    ${true}
    ${false}
    `('should post configuration property with isSensitive: $isSensitive', async ({ isSensitive }) => {
      await deployUtils.setConfiguration(
          {id:'environment-1', organizationId: 'organization-1'},
          'blueprint-1',
          'variable-name',
          'variable-value',
          isSensitive
      );

      expect(callApiMock).toHaveBeenCalledWith(
          'post',
          'configuration',
          { data: expect.objectContaining({ isSensitive } ) }
      );
    })
  });
});
