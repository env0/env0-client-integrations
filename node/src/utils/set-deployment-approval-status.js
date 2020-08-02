const DeployUtils = require('../utils/deploy-utils');

const setDeploymentApprovalStatus = command => async options => {
  const deployUtils = new DeployUtils();

  const environment = await deployUtils.getEnvironment(options.environmentName, options.projectId);

  if (!environment) {
    throw new Error(`Could not find an environment with the name ${options.environmentName}`);
  }

  if (environment.status !== 'WAITING_FOR_USER') {
    throw new Error(`Environment is not waiting for approval. Environment status is ${environment.status}`);
  }

  const { latestDeploymentLog } = environment;

  command === 'approve'
    ? await deployUtils.approveDeployment(latestDeploymentLog.id)
    : await deployUtils.cancelDeployment(latestDeploymentLog.id);

  const status = await deployUtils.pollDeploymentStatus(latestDeploymentLog.id);
  deployUtils.assertDeploymentStatus(status);
};

module.exports = setDeploymentApprovalStatus;
