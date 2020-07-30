const DeployUtils = require('../src/env0-deploy-utils');

jest.mock('../src/commons/api-client', () =>
  jest.fn().mockImplementation(() => ({
    callApi: mockCallApi,
    sleep: () => Promise.resolve()
  }))
);

const mockCallApi = jest.fn();

const mockEnvironmentId = 'environment0';
const mockDeploymentId = 'deployment0';

describe('env0-deploy-utils', () => {
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
        { id: 'environment-1', organizationId: 'organization-1' },
        'blueprint-1',
        'variable-name',
        'variable-value',
        false
      );

      expect(mockCallApi).toHaveBeenCalledWith('get', 'configuration', {
        params: {
          blueprintId: 'blueprint-1',
          environmentId: 'environment-1',
          organizationId: 'organization-1'
        }
      });
    });

    it('should post configuration property without id when new', async () => {
      await deployUtils.setConfiguration(
        { id: 'environment-1', organizationId: 'organization-1' },
        'blueprint-1',
        'variable-name',
        'variable-value',
        false
      );

      expect(mockCallApi).toHaveBeenCalledWith('post', 'configuration', {
        data: expect.objectContaining({
          isSensitive: false,
          name: 'variable-name',
          organizationId: 'organization-1',
          projectId: undefined,
          scope: 'ENVIRONMENT',
          scopeId: 'environment-1',
          type: 0,
          value: 'variable-value'
        })
      });
    });

    it.each`
      isSensitive
      ${true}
      ${false}
    `('should post configuration property with isSensitive: $isSensitive', async ({ isSensitive }) => {
      await deployUtils.setConfiguration(
        { id: 'environment-1', organizationId: 'organization-1' },
        'blueprint-1',
        'variable-name',
        'variable-value',
        isSensitive
      );

      expect(mockCallApi).toHaveBeenCalledWith('post', 'configuration', {
        data: expect.objectContaining({ isSensitive })
      });
    });
  });

  describe('wait for environment', () => {
    it.each`
      status
      ${'CREATED'}
      ${'INACTIVE'}
      ${'ACTIVE'}
      ${'FAILED'}
      ${'TIMEOUT'}
      ${'CANCELLED'}
      ${'ABORTED'}
    `('should call api client once', async ({ status }) => {
      mockCallApi.mockResolvedValue({ status });

      await deployUtils.waitForEnvironment(mockEnvironmentId);

      expect(mockCallApi).toBeCalledWith('get', `environments/${mockEnvironmentId}`);
      expect(mockCallApi).toBeCalledTimes(1);
    });

    it('should call api client twice', async () => {
      mockCallApi.mockResolvedValueOnce({ status: 'TEST' });
      mockCallApi.mockResolvedValueOnce({ status: 'ACTIVE' });

      await deployUtils.waitForEnvironment(mockEnvironmentId);

      expect(mockCallApi).toBeCalledWith('get', `environments/${mockEnvironmentId}`);
      expect(mockCallApi).toBeCalledTimes(2);
    });
  });

  describe('poll deployment status', () => {
    beforeEach(() => {
      mockCallApi.mockResolvedValue([]);
    });

    it('should call api and and return status', async () => {
      const mockStatus = 'SUCCESS';
      mockCallApi.mockResolvedValueOnce({ status: mockStatus });

      const status = await deployUtils.pollDeploymentStatus(mockDeploymentId);

      expect(mockCallApi).toBeCalledWith('get', `environments/deployments/${mockDeploymentId}`);
      expect(status).toBe(mockStatus);
    });
  });

  describe('write deployment steps', () => {
    it('should call api', async () => {
      mockCallApi.mockResolvedValue([]);

      await deployUtils.processDeploymentSteps(mockDeploymentId, []);

      expect(mockCallApi).toBeCalledWith('get', `deployments/${mockDeploymentId}/steps`);
    });

    it.each`
      stepsFromApi                                      | stepsToSkip
      ${[{ name: 'git:clone', status: 'SUCCESS' }]}     | ${['git:clone']}
      ${[{ name: 'git:clone', status: 'NOT_STARTED' }]} | ${[]}
    `('should skip step log', async ({ stepsFromApi, stepsToSkip }) => {
      mockCallApi.mockResolvedValue(stepsFromApi);

      const doneSteps = await deployUtils.processDeploymentSteps(mockDeploymentId, stepsToSkip);

      expect(doneSteps).toEqual([]);
    });

    it('should get step log', async () => {
      const mockStep = { name: 'git:clone', status: 'SUCCESS' };

      mockCallApi.mockResolvedValueOnce([mockStep]);
      mockCallApi.mockResolvedValueOnce([mockStep]); // mock for getting steps in write deployment step log function
      mockCallApi.mockResolvedValueOnce({ events: [] }); // mock for the write deployment step log function

      const doneSteps = await deployUtils.processDeploymentSteps(mockDeploymentId, []);

      expect(doneSteps).toEqual([mockStep.name]);
    });
  });

  describe('write deployment step log', () => {
    const mockStep = { name: 'git:clone', status: 'SUCCESS' };

    it('should call api for once (both for getting steps and log = total of 2)', async () => {
      mockCallApi.mockResolvedValueOnce([mockStep]);
      mockCallApi.mockResolvedValueOnce({ events: [], hasMoreLogs: false });

      await deployUtils.writeDeploymentStepLog(mockDeploymentId, mockStep.name);

      expect(mockCallApi).toBeCalledWith('get', `deployments/${mockDeploymentId}/steps/${mockStep.name}/log`, {
        params: { startTime: undefined }
      });
      expect(mockCallApi).toBeCalledTimes(2);
    });

    it.each`
      when                           | hasMoreLogs | mockStep
      ${'hasMore logs is true'}      | ${true}     | ${{ name: 'git:clone', status: 'SUCCESS' }}
      ${'step is still in progress'} | ${false}    | ${{ name: 'git:clone', status: 'IN_PROGRESS' }}
    `(
      'should call api twice (both for getting steps and log = total of 4) when $when',
      async ({ hasMoreLogs, mockStep }) => {
        mockCallApi.mockResolvedValueOnce([mockStep]);
        mockCallApi.mockResolvedValueOnce({ events: [], hasMoreLogs });
        mockCallApi.mockResolvedValueOnce([{ ...mockStep, status: 'SUCCESS' }]);
        mockCallApi.mockResolvedValueOnce({ events: [], hasMoreLogs: false });

        await deployUtils.writeDeploymentStepLog(mockDeploymentId, mockStep.name);

        expect(mockCallApi).toBeCalledWith('get', `deployments/${mockDeploymentId}/steps/${mockStep.name}/log`, {
          params: { startTime: undefined }
        });
        expect(mockCallApi).toBeCalledTimes(4);
      }
    );

    it('should use nextStartTime from api on consecutive calls', async () => {
      const mockNextStartTime = 'party time';

      mockCallApi.mockResolvedValueOnce([mockStep]);
      mockCallApi.mockResolvedValueOnce({
        events: [],
        hasMoreLogs: true,
        nextStartTime: mockNextStartTime
      });
      mockCallApi.mockResolvedValueOnce([{ ...mockStep, status: 'SUCCESS' }]);
      mockCallApi.mockResolvedValueOnce({ events: [], hasMoreLogs: false });

      await deployUtils.writeDeploymentStepLog(mockDeploymentId, mockStep.name);

      expect(mockCallApi).toBeCalledWith('get', `deployments/${mockDeploymentId}/steps/${mockStep.name}/log`, {
        params: { startTime: undefined }
      });
      expect(mockCallApi).toHaveBeenLastCalledWith(
        'get',
        `deployments/${mockDeploymentId}/steps/${mockStep.name}/log`,
        { params: { startTime: mockNextStartTime } }
      );
    });
  });

  describe('deploy environment', async () => {
    const mockEnvironment = { id: 'env0', status: 'ACTIVE' };
    const mockBlueprintRevision = 'rev0';
    const mockBlueprintId = 'blueprint0';
    const mockRequiresApproval = true;

    beforeEach(() => {
      mockCallApi.mockReturnValue(mockEnvironment);
    });

    it('should call api', async () => {
      await deployUtils.deployEnvironment(
        mockEnvironment,
        mockBlueprintRevision,
        mockBlueprintId,
        mockRequiresApproval
      );

      expect(mockCallApi).toHaveBeenLastCalledWith('post', `environments/${mockEnvironment.id}/deployments`, {
        data: {
          blueprintId: mockBlueprintId,
          blueprintRevision: mockBlueprintRevision,
          userRequiresApproval: mockRequiresApproval
        }
      });
    });
  });

  describe('approve deployment', () => {
    it('should call api', async () => {
      await deployUtils.approveDeployment(mockDeploymentId);

      expect(mockCallApi).toBeCalledWith('put', `environments/deployments/${mockDeploymentId}`);
    });
  });

  describe('cancel deployment', () => {
    it('should call api', async () => {
      await deployUtils.cancelDeployment(mockDeploymentId);

      expect(mockCallApi).toBeCalledWith('put', `environments/deployments/${mockDeploymentId}/cancel`);
    });
  });
});
