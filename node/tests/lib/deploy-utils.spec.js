const mockCallApi = jest.fn();
const { options } = require('../../src/config/constants');
const DeployUtils = require('../../src/lib/deploy-utils');

jest.mock('../../src/lib/logger');
jest.mock('../../src/lib/api-client', () =>
  jest.fn().mockImplementation(() => ({
    callApi: mockCallApi,
    sleep: () => Promise.resolve()
  }))
);

const { BLUEPRINT_ID, REVISION, REQUIRES_APPROVAL, TARGETS, ENVIRONMENT_NAME, PROJECT_ID } = options;

const mockDeploymentId = 'deployment0';
const mockDeployment = { id: mockDeploymentId };

describe('deploy utils', () => {
  const deployUtils = new DeployUtils();

  describe('poll deployment status', () => {
    beforeEach(() => {
      mockCallApi.mockResolvedValue([]);
    });

    it('should call api and and return status', async () => {
      const mockStatus = 'SUCCESS';
      mockCallApi.mockResolvedValueOnce({ status: mockStatus });

      const status = await deployUtils.pollDeploymentStatus(mockDeployment);

      expect(mockCallApi).toBeCalledWith('get', `environments/deployments/${mockDeploymentId}`);
      expect(status).toBe(mockStatus);
    });

    describe('when deployment is queued', () => {
      it('should call process deployment steps more than once (aka add QUEUED status to polllable statuses)', async () => {
        mockCallApi.mockResolvedValueOnce({ status: 'QUEUED' });

        await deployUtils.pollDeploymentStatus({ ...mockDeployment, status: 'QUEUED' });

        expect(mockCallApi).toHaveBeenNthCalledWith(2, 'get', `deployments/${mockDeploymentId}/steps`);
        expect(mockCallApi).toHaveBeenNthCalledWith(4, 'get', `deployments/${mockDeploymentId}/steps`);
      });
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

  describe('create and deploy environment', () => {
    it('should call api with proper options', async () => {
      const mockOptions = {
        [REVISION]: 'rev0',
        [BLUEPRINT_ID]: 'blueprint0',
        [ENVIRONMENT_NAME]: 'foo',
        [PROJECT_ID]: 'proj0',
        [REQUIRES_APPROVAL]: 'true'
      };

      const configurationChanges = { config1: 'foo', config2: 'bar' };

      const expectedPayload = {
        name: mockOptions[ENVIRONMENT_NAME],
        projectId: mockOptions[PROJECT_ID],
        deployRequest: {
          blueprintId: mockOptions[BLUEPRINT_ID],
          blueprintRevision: mockOptions[REVISION]
        },
        configurationChanges,
        requiresApproval: true
      };

      await deployUtils.createAndDeployEnvironment(mockOptions, configurationChanges);

      expect(mockCallApi).toHaveBeenCalledWith('post', `environments`, { data: expectedPayload });
    });
  });

  describe('deploy environment', () => {
    const mockEnvironment = { id: 'env0', status: 'ACTIVE' };
    const mockOptions = {
      [REVISION]: 'rev0',
      [TARGETS]: 'target1,target2,target3'
    };

    beforeEach(() => {
      mockCallApi.mockReturnValue(mockEnvironment);
    });

    it('should call api with proper options', async () => {
      const configurationChanges = { config1: 'foo', config2: 'bar' };

      await deployUtils.deployEnvironment(mockEnvironment, mockOptions, configurationChanges);

      expect(mockCallApi).toHaveBeenCalledWith('post', `environments/${mockEnvironment.id}/deployments`, {
        data: {
          blueprintRevision: mockOptions[REVISION],
          targets: mockOptions[TARGETS],
          configurationChanges
        }
      });
    });

    it.each`
      requiresApproval | expectedPayload
      ${'false'}       | ${{ userRequiresApproval: false }}
      ${'true'}        | ${{ userRequiresApproval: true }}
    `('should pass proper requires approval boolean param', async ({ requiresApproval, expectedPayload }) => {
      await deployUtils.deployEnvironment(mockEnvironment, { [REQUIRES_APPROVAL]: requiresApproval });

      expect(mockCallApi).toHaveBeenCalledWith('post', `environments/${mockEnvironment.id}/deployments`, {
        data: expectedPayload
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
