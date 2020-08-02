const DeployUtils = require('../lib/deploy-utils');

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

  deployUtils.assertDeploymentStatus(status);
};

module.exports = destroy;
