const agentsSettingsListAgents = require('../../src/commands/agents-settings-list-agents');
const Env0ApiClient = require('../../src/lib/api-client');
const logger = require('../../src/lib/logger');
const { options } = require('../../src/config/constants');

const { API_KEY, API_SECRET, ORGANIZATION_ID } = options;

jest.mock('../../src/lib/api-client');
jest.mock('../../src/lib/logger');

describe('agentsSettingsListAgents', () => {
  const mockApiClient = {
    init: jest.fn(),
    callApi: jest.fn()
  };

  const mockOptions = {
    [API_KEY]: 'testApiKey',
    [API_SECRET]: 'testApiSecret',
    [ORGANIZATION_ID]: 'testOrgId'
  };

  const mockResult = [{ id: 'agent1', name: 'Agent 1' }, { id: 'agent2', name: 'Agent 2' }];

  beforeEach(() => {
    Env0ApiClient.mockImplementation(() => mockApiClient);
    mockApiClient.init.mockClear();
    mockApiClient.callApi.mockClear();
    logger.info.mockClear();
  });

  it('should initialize the API client with apiKey and apiSecret', async () => {
    mockApiClient.callApi.mockResolvedValue(mockResult);

    await agentsSettingsListAgents(mockOptions);

    expect(Env0ApiClient).toHaveBeenCalledTimes(1);
    expect(mockApiClient.init).toHaveBeenCalledWith(mockOptions[API_KEY], mockOptions[API_SECRET]);
  });

  it('should call the API to get agents with organizationId', async () => {
    mockApiClient.callApi.mockResolvedValue(mockResult);

    await agentsSettingsListAgents(mockOptions);

    expect(mockApiClient.callApi).toHaveBeenCalledWith('get', 'agents', {
      params: { organizationId: mockOptions[ORGANIZATION_ID] }
    });
  });

  it('should log the result as JSON', async () => {
    mockApiClient.callApi.mockResolvedValue(mockResult);

    await agentsSettingsListAgents(mockOptions);

    expect(logger.info).toHaveBeenCalledWith(JSON.stringify(mockResult, null, 2));
  });

  it('should handle API errors', async () => {
    const error = new Error('API Error');
    mockApiClient.callApi.mockRejectedValue(error);

    await expect(agentsSettingsListAgents(mockOptions)).rejects.toThrow('API Error');
  });
});
