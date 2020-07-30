const DeployUtils = require('./env0-deploy-utils');
const configManager = require('./commons/config-manager');
const { OPTIONS } = require('./commons/constants');

const { API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID } = OPTIONS;

const deployUtils = new DeployUtils();

const assertRequiredOptions = options => {
  const requiredOptions = [API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID];

  let missingOptions = [];
  requiredOptions.forEach(opt => !Object.keys(options).includes(opt) && missingOptions.push(opt));

  if (missingOptions.length) {
    throw new Error(`Missing required options: ${missingOptions}`);
  }
};

const assertDeploymentStatus = status => {
  if (!['SUCCESS', 'WAITING_FOR_USER', 'CANCELLED'].includes(status)) {
    throw new Error(`Deployment failed. Current deployment status is ${status}`);
  }
};

const runCommand = async (command, options, environmentVariables) => {
  options = configManager.read(options);
  assertRequiredOptions(options);

  console.log(`Running ${command} with the following arguments:`);
  Object.keys(options).forEach(opt => console.log(`$ ${opt}: ${options[opt]}`));

  const commands = {
    destroy: destroy,
    deploy: createAndDeploy,
    approve: setDeploymentApprovalStatus('approve'),
    cancel: setDeploymentApprovalStatus('cancel')
  };

  await deployUtils.init(options);

  console.log('Waiting for deployment to start...');
  await commands[command](options, environmentVariables);
  console.log(`Command ${command} has finished successfully.`);

  configManager.write(options);
};

const setDeploymentApprovalStatus = command => async options => {
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
  assertDeploymentStatus(status);
};

const createAndDeploy = async (options, environmentVariables) => {
  const { environmentName, projectId, organizationId, blueprintId, revision, requiresApproval } = options;

  let environment = await deployUtils.getEnvironment(environmentName, projectId);

  if (!environment) {
    environment = await deployUtils.createEnvironment(environmentName, organizationId, projectId);
  }

  await setConfigurationFromOptions(environmentVariables, environment, blueprintId);

  const deployment = await deployUtils.deployEnvironment(environment, revision, blueprintId, requiresApproval);
  const status = await deployUtils.pollDeploymentStatus(deployment.id);

  assertDeploymentStatus(status);
};

const destroy = async options => {
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

const setConfigurationFromOptions = async (environmentVariables, environment, blueprintId) => {
  if (environmentVariables && environmentVariables.length > 0) {
    for (const config of environmentVariables) {
      console.log(
        `Setting Environment Variable ${config.name} to be ${config.value} in environmentId: ${environment.id}`
      );
      await deployUtils.setConfiguration(environment, blueprintId, config.name, config.value, config.sensitive);
    }
  }
};

module.exports = runCommand;
