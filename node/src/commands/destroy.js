const DeployUtils = require('../lib/deploy-utils');
const { options } = require('../config/constants');
const _ = require('lodash');
const { convertStringToBoolean, removeEmptyValuesFromObj } = require('../lib/general-utils');

const { PROJECT_ID, ENVIRONMENT_NAME, REQUIRES_APPROVAL, SKIP_STATE_REFRESH } = options;

const assertEnvironmentExists = environment => {
  if (!environment) {
    throw new Error(`Could not find an environment with the name ${options[ENVIRONMENT_NAME]}`);
  }
};

const destroy = async options => {
  const deployUtils = new DeployUtils();

  const environment = await deployUtils.getEnvironment(options[ENVIRONMENT_NAME], options[PROJECT_ID]);
  let status;

  assertEnvironmentExists(environment);

  const requiresApproval = convertStringToBoolean(options[REQUIRES_APPROVAL]);

  if (!_.isUndefined(requiresApproval) && requiresApproval !== environment.requiresApproval) {
    await deployUtils.updateEnvironment(environment, { requiresApproval: requiresApproval });
  }

  const params = removeEmptyValuesFromObj({
    [SKIP_STATE_REFRESH]: options[SKIP_STATE_REFRESH]
  });
  const deployment = await deployUtils.destroyEnvironment(environment, params);

  status = await deployUtils.pollDeploymentStatus(deployment);

  deployUtils.assertDeploymentStatus(status);
};

module.exports = destroy;
