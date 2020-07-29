const DeployUtils = require('./env0-deploy-utils');
const configManager = require("./commons/config-manager");
const { OPTIONS } = require('./commons/constants');

const { API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID } = OPTIONS;

const deployUtils = new DeployUtils();

const assertRequiredOptions = (options) => {
  const requiredOptions = [API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID];

  let missingOptions = [];
  requiredOptions.forEach(opt => !Object.keys(options).includes(opt) && missingOptions.push(opt));

  if (missingOptions.length) {
    throw new Error(`Missing required options: ${missingOptions}`)
  }
}

const getAndAssertAnExistingEnvironment = async (options) => {
  const environment = await deployUtils.getEnvironment(options.environmentName, options.projectId);
  if (!environment) throw new Error(`Could not find an environment with the name ${options.environmentName}`);
}

const runCommand = async (command, options, environmentVariables) => {
  options = configManager.read(options);
  assertRequiredOptions(options);

  console.log(`running ${command} with the following arguments:`, options);

  const commands = {
    destroy: destroy,
    deploy: createAndDeploy,
    approve: setDeploymentApprovalStatus('approve'),
    cancel: setDeploymentApprovalStatus('cancel')
  }

  await DeployUtils.init(options);
  await commands[command](options, environmentVariables);

  configManager.write(options);
};

const setDeploymentApprovalStatus = (command) => async (options) => {
  const environment = await getAndAssertAnExistingEnvironment(options);
}

const createAndDeploy = async (options, environmentVariables) => {
  console.log('Starting deployment');

  let environment = await deployUtils.getEnvironment(options.environmentName, options.projectId);
  if (!environment) {
    console.log('did not find an environment');
    environment = await deployUtils.createEnvironment(options.environmentName, options.organizationId, options.projectId);
  }
  await setConfigurationFromOptions(environmentVariables, environment, options.blueprintId);
  await deployUtils.pollEnvironmentStatus(environment.id);
  await deployUtils.deployEnvironment(environment, options.revision, options.blueprintId);
  const lastStatus = await deployUtils.pollEnvironmentStatus(environment.id);
  if (lastStatus !== 'ACTIVE') {
    throw new Error(`Environment ${environment.id} did not reach ACTIVE status`);
  }
};

const destroy = async (options) => {
  console.log('Starting destroying an environment');
  const environment = await deployUtils.getEnvironment(options.environmentName, options.projectId);

  if (environment) {
    await deployUtils.pollEnvironmentStatus(environment.id);
    await deployUtils.destroyEnvironment(environment);
    await deployUtils.pollEnvironmentStatus(environment.id);

    if (options.archiveAfterDestroy) {
      await deployUtils.archiveIfInactive(environment.id);
    }
  }
  else {
    throw new Error(`Could not find an environment with the name ${options.environmentName}`);
  }
};

const setConfigurationFromOptions = async (environmentVariables, environment, blueprintId) => {
  if (environmentVariables && environmentVariables.length > 0) {
    for (const config of environmentVariables) {
      console.log(`Setting Environment Variable ${config.name} to be ${config.value} in environmentId: ${environment.id}`);
      await deployUtils.setConfiguration(environment, blueprintId, config.name, config.value, config.sensitive);
    }
  }
};

module.exports = runCommand;
