const DeployUtils = require("../src/env0-deploy-utils");

jest.mock("../src/commons/api-client", () =>
    jest.fn().mockImplementation(() => ({ callApi: mockCallApi, sleep: () => Promise.resolve() }))
);

const mockCallApi = jest.fn();

const mockEnvironmentId = 'environment0';
const mockDeploymentId = 'deployment0';

describe("env0-deploy-utils", () => {
  const deployUtils = new DeployUtils();

  beforeEach(() => {
    mockCallApi.mockClear();
  });

  describe('set configuration', () => {
    beforeEach(() => {
      mockCallApi.mockResolvedValue([]);
    });

    it('should query existing configurations for update', async () => {
      await deployUtils.setConfiguration(
          {id:'environment-1', organizationId: 'organization-1'},
          'blueprint-1',
          'variable-name',
          'variable-value',
          false
      );

      expect(mockCallApi).toHaveBeenCalledWith(
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

      expect(mockCallApi).toHaveBeenCalledWith(
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

      expect(mockCallApi).toHaveBeenCalledWith(
          'post',
          'configuration',
          { data: expect.objectContaining({ isSensitive } ) }
      );
    })
  });

  describe('wait for environment', () => {
    it.each`
    status
    ${'CREATED'}
    ${'INACTIVE'}
    ${'ACTIVE'}
    ${'FAILED'}
    ${'TIMEOUT'}
    `('should call api client once', async ({ status }) => {
      mockCallApi.mockResolvedValue({ status });

      await deployUtils.waitForEnvironment(mockEnvironmentId);

      expect(mockCallApi).toBeCalledWith('get', `environments/${mockEnvironmentId}`,);
      expect(mockCallApi).toBeCalledTimes(1);
    })

    it('should call api client twice', async () => {
      mockCallApi.mockResolvedValueOnce({ status: 'TEST' });
      mockCallApi.mockResolvedValueOnce({ status: 'ACTIVE' });

      await deployUtils.waitForEnvironment(mockEnvironmentId);

      expect(mockCallApi).toBeCalledWith('get', `environments/${mockEnvironmentId}`,);
      expect(mockCallApi).toBeCalledTimes(2);
    })
  });

  describe('poll deployment status', () => {
    beforeEach(() => {
      mockCallApi.mockResolvedValue([]);
    });

    it('should call api', async () => {
      mockCallApi.mockResolvedValueOnce({ status: 'SUCCESS' });

      await deployUtils.pollDeploymentStatus(mockDeploymentId);

      expect(mockCallApi).toBeCalledWith('get', `environments/deployments/${mockDeploymentId}`);
    });
  });

  describe('write deployment steps', () => {
    it('should call api', async () => {
      mockCallApi.mockResolvedValue([]);

      await deployUtils.fetchDeploymentSteps(mockDeploymentId, []);

      expect(mockCallApi).toBeCalledWith('get', `deployments/${mockDeploymentId}/steps`);
    })

    it.each`
    stepsFromApi | stepsToSkip
    ${[ { name: 'git:clone', status: 'SUCCESS' } ]} | ${[ 'git:clone' ]}
    ${[{ name: 'git:clone', status: 'NOT_STARTED' } ]} | ${[]}
    `('should skip step log', async ({ stepsFromApi, stepsToSkip }) => {
      mockCallApi.mockResolvedValue(stepsFromApi);

      const doneSteps = await deployUtils.fetchDeploymentSteps(mockDeploymentId, stepsToSkip);

      expect(doneSteps).toEqual([]);
    })

    it('should get step log', async () => {
      const mockStep = { name: 'git:clone', status: 'SUCCESS' };

      mockCallApi.mockResolvedValueOnce([ mockStep ]);
      mockCallApi.mockResolvedValueOnce({ events: [] }); // mock for the write deployment step log function

      const doneSteps = await deployUtils.fetchDeploymentSteps(mockDeploymentId, []);

      expect(doneSteps).toEqual([ mockStep.name ])
    })
  })

  describe('write deployment step log', () => {
    const mockStepName = 'git:clone';

    it('should call api once when hasMoreLogs=false', async () => {
      mockCallApi.mockResolvedValueOnce({ events: [], hasMoreLogs: false });

      await deployUtils.writeDeploymentStepLog(mockDeploymentId, mockStepName)

      expect(mockCallApi).toBeCalledWith('get', `deployments/${mockDeploymentId}/steps/${mockStepName}/log`);
      expect(mockCallApi).toBeCalledTimes(1);
    });

    it('should call api twice when hasMoreLogs=true', async () => {
      mockCallApi.mockResolvedValueOnce({ events: [], hasMoreLogs: true });
      mockCallApi.mockResolvedValueOnce({ events: [], hasMoreLogs: false });

      await deployUtils.writeDeploymentStepLog(mockDeploymentId, mockStepName)

      expect(mockCallApi).toBeCalledWith('get', `deployments/${mockDeploymentId}/steps/${mockStepName}/log`);
      expect(mockCallApi).toBeCalledTimes(2);
    });
  });
});
