const DeployUtils = require('../lib/deploy-utils');
const logger = require('../lib/logger');

const setConfigurationFromOptions = async (environmentVariables, environment, blueprintId) => {
  const deployUtils = new DeployUtils();

  if (environmentVariables && environmentVariables.length > 0) {
    for (const config of environmentVariables) {
      logger.info(
        `Setting Environment Variable ${config.name} to be ${config.value} in environmentId: ${environment.id}`
      );
      await deployUtils.setConfiguration(environment, blueprintId, config.name, config.value, config.sensitive);
    }
  }
};

const deploy = async (options, environmentVariables) => {
  const deployUtils = new DeployUtils();

  const { environmentName, projectId, organizationId, blueprintId } = options;

  logger.info('Waiting for deployment to start...');
  let environment = await deployUtils.getEnvironment(environmentName, projectId);

  if (!environment) {
    environment = await deployUtils.createEnvironment(environmentName, organizationId, projectId);
  }

  await setConfigurationFromOptions(environmentVariables, environment, blueprintId);

  const deployment = await deployUtils.deployEnvironment(environment, options);
  const status = await deployUtils.pollDeploymentStatus(deployment.id);

  deployUtils.assertDeploymentStatus(status);
};

module.exports = deploy;
