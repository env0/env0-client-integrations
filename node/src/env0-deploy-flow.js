const DeployUtils = require('./env0-deploy-utils');

const deployUtils = new DeployUtils();

const assertRequiredOptions = (options) => {
  const requiredOptions = ['organizationId', 'projectId', 'apiKey', 'apiSecret']

  let missingOptions = [];
  requiredOptions.forEach(opt => !Object.keys(options).includes(opt) && missingOptions.push(opt));

  if (missingOptions.length) {
    throw new Error(`Missing required options: ${missingOptions}`)
  }
}

const runDeployment = async (command, options, environmentVariables) => {
  assertRequiredOptions(options);

  console.log(`running ${command} with the following arguments:`, options);

  await DeployUtils.init(options);
  switch(command) {
    case 'deploy':
      return await createAndDeploy(options, environmentVariables);
    case 'destroy':
      return await destroy(options);
    default:
      throw new Error(`Action ${command} is Invalid, Valid actions are Deploy and Destroy`);
  }
};

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

module.exports = runDeployment;
