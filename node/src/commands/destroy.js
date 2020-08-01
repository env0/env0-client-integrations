const DeployUtils = require('../utils/deploy-utils');
const { assertDeploymentStatus } = require('../utils/assertions');

const destroy = async options => {
  const deployUtils = new DeployUtils();

  const environment = await deployUtils.getEnvironment(options.environmentName, options.projectId);
  let status;

  if (environment) {
    const deployment = await deployUtils.destroyEnvironment(environment);
    status = await deployUtils.pollDeploymentStatus(deployment.id);

    if (options.archiveAfterDestroy) await deployUtils.archiveIfInactive(environment.id);
  } else {
    throw new Error(`Could not find an environment with the name ${options.environmentName}`);
  }

  assertDeploymentStatus(status);
};

module.exports = destroy;
