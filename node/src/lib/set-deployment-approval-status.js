const DeployUtils = require('../lib/deploy-utils');
const logger = require('../lib/logger');

const setDeploymentApprovalStatus = (command, shouldProcessDeploymentSteps) => async options => {
  const deployUtils = new DeployUtils();

  const environment = await deployUtils.getEnvironment(options);

  if (!environment) {
    throw new Error(`Could not find an environment with the name ${options.environmentName}`);
  }

  if (environment.status !== 'WAITING_FOR_USER') {
    throw new Error(`Environment is not waiting for approval. Environment status is ${environment.status}`);
  }

  const { latestDeploymentLog } = environment;

  if (command === 'approve') logger.info('Approving deployment. Waiting for it to resume...');

  command === 'approve'
    ? await deployUtils.approveDeployment(latestDeploymentLog.id)
    : await deployUtils.cancelDeployment(latestDeploymentLog.id);

  const status = await deployUtils.pollDeploymentStatus(latestDeploymentLog, shouldProcessDeploymentSteps);
  deployUtils.assertDeploymentStatus(status);
};

module.exports = setDeploymentApprovalStatus;
