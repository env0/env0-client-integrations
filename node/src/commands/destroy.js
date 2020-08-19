const DeployUtils = require('../lib/deploy-utils');
const { options } = require('../config/constants');
const _ = require('lodash');
const logger = require('../lib/logger');
const { convertStringToBoolean } = require('../lib/general-utils');

const { PROJECT_ID, ENVIRONMENT_NAME, REQUIRES_APPROVAL } = options;

const assertEnvironmentExists = environment => {
  if (!environment) {
    throw new Error(`Could not find an environment with the name ${options[ENVIRONMENT_NAME]}`);
  }
};

const destroy = async options => {
  const deployUtils = new DeployUtils();

  logger.info('Waiting for deployment to start...');
  const environment = await deployUtils.getEnvironment(options[ENVIRONMENT_NAME], options[PROJECT_ID]);
  let status;

  assertEnvironmentExists(environment);

  const requiresApproval = convertStringToBoolean(options[REQUIRES_APPROVAL]);

  if (!_.isUndefined(requiresApproval) && requiresApproval !== environment.requiresApproval) {
    await deployUtils.updateEnvironment(environment, { requiresApproval: requiresApproval });
  }

  const deployment = await deployUtils.destroyEnvironment(environment);
  status = await deployUtils.pollDeploymentStatus(deployment.id);

  deployUtils.assertDeploymentStatus(status);
};

module.exports = destroy;
