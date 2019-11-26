const DeployUtils = require('./env0-deploy-utils');

const deployUtils = new DeployUtils();

const runDeployment = async (options, environmentVariables) => {
  await DeployUtils.init(options);
  switch(options.action.toLowerCase()) {
    case 'deploy':
      return await createAndDeploy(options, environmentVariables);
    case 'destroy':
      return await destroy(options);
    default:
      throw new Error(`Action ${options.action} is Invalid, Valid actions are Deploy and Destroy`);
  }
};

const createAndDeploy = async (options, environmentVariables) => {
  console.log('Starting deployment');

  let environment = await deployUtils.getEnvironment(options.environmentName, options.organizationId);
  if (!environment) {
    console.log('did not find an environment');
    environment = await deployUtils.createEnvironment(options.environmentName, options.organizationId, options.projectId);
  }
  await setConfigurationFromOptions(environmentVariables, environment);
  await deployUtils.pollEnvironmentStatus(environment.id);
  await deployUtils.deployEnvironment(environment, options.revision, options.blueprintId);
  await deployUtils.pollEnvironmentStatus(environment.id);
};

const destroy = async (options) => {
  console.log('Starting destroying an environment');
  const environment = await deployUtils.getEnvironment(options.environmentName, options.organizationId);

  if (environment) {
    await deployUtils.pollEnvironmentStatus(environment.id);
    await deployUtils.destroyEnvironment(environment);
    await deployUtils.pollEnvironmentStatus(environment.id);
  }
  else {
    throw new Error(`Could not find an environment with the name ${options.environmentName}`);
  }
};

const setConfigurationFromOptions = async (environmentVariables, environment) => {
  if (environmentVariables && environmentVariables.length > 0) {
    await environmentVariables.forEach(async(config) => {
      console.log(`Setting Environment Variable ${config.name} to be ${config.value} in environmentId: ${environment.id}`);
      await deployUtils.setConfiguration(environment, options.blueprintId, config.name, config.value);
    });
  }
};

module.exports = runDeployment;
