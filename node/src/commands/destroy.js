import DeployUtils from '../lib/deploy-utils.js';
import { options } from '../config/constants.js';
import _ from 'lodash';
import { convertStringToBoolean, removeEmptyValuesFromObj } from '../lib/general-utils.js';

const { ENVIRONMENT_NAME, REQUIRES_APPROVAL, SKIP_STATE_REFRESH, CHECKOUT_UPDATED_CODE } = options;

const assertEnvironmentExists = environment => {
  if (!environment) {
    throw new Error(`Could not find an environment with the name ${options[ENVIRONMENT_NAME]}`);
  }
};

const destroy = async options => {
  const deployUtils = new DeployUtils();

  const environment = await deployUtils.getEnvironment(options);
  let status;

  assertEnvironmentExists(environment);

  const requiresApproval = convertStringToBoolean(options[REQUIRES_APPROVAL]);

  if (!_.isUndefined(requiresApproval) && requiresApproval !== environment.requiresApproval) {
    await deployUtils.updateEnvironment(environment, { requiresApproval: requiresApproval });
  }

  const params = removeEmptyValuesFromObj({
    [SKIP_STATE_REFRESH]: options[SKIP_STATE_REFRESH],
    [CHECKOUT_UPDATED_CODE]: options[CHECKOUT_UPDATED_CODE]
  });
  const deployment = await deployUtils.destroyEnvironment(environment, params);

  status = await deployUtils.pollDeploymentStatus(deployment);

  deployUtils.assertDeploymentStatus(status);
};

export default destroy;
