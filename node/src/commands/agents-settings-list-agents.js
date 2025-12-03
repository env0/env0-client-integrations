const Env0ApiClient = require('../lib/api-client');
const logger = require('../lib/logger');
const { options } = require('../config/constants');

const { API_KEY, API_SECRET, ORGANIZATION_ID } = options;

const agentsSettingsListAgents = async options => {
  const apiClient = new Env0ApiClient();

  await apiClient.init(options[API_KEY], options[API_SECRET]);

  const result = await apiClient.callApi('get', 'agents', {
    params: { organizationId: options[ORGANIZATION_ID] }
  });

  logger.info(JSON.stringify(result, null, 2));
};

module.exports = agentsSettingsListAgents;
