const DeployUtils = require('../lib/deploy-utils');
const { options } = require('../config/constants');
const _ = require('lodash');
const logger = require('../lib/logger');

const { PROJECT_ID, ENVIRONMENT_NAME, REQUIRES_APPROVAL, ARCHIVE_AFTER_DESTROY } = options;

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

  if (!_.isUndefined(options[REQUIRES_APPROVAL]) && options[REQUIRES_APPROVAL] !== environment.requiresApproval) {
    await deployUtils.updateEnvironment(environment, { requiresApproval: options[REQUIRES_APPROVAL] });
  }

  const deployment = await deployUtils.destroyEnvironment(environment);
  status = await deployUtils.pollDeploymentStatus(deployment.id);

  if (options[ARCHIVE_AFTER_DESTROY]) await deployUtils.archiveIfInactive(environment.id);

  deployUtils.assertDeploymentStatus(status);
};

module.exports = destroy;
