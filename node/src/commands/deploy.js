const DeployUtils = require('../utils/deploy-utils');
const { assertDeploymentStatus } = require('../utils/assertions');

const setConfigurationFromOptions = async (environmentVariables, environment, blueprintId) => {
  const deployUtils = new DeployUtils();

  if (environmentVariables && environmentVariables.length > 0) {
    for (const config of environmentVariables) {
      console.log(
        `Setting Environment Variable ${config.name} to be ${config.value} in environmentId: ${environment.id}`
      );
      await deployUtils.setConfiguration(environment, blueprintId, config.name, config.value, config.sensitive);
    }
  }
};

const deploy = async (options, environmentVariables) => {
  const deployUtils = new DeployUtils();

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

module.exports = deploy;
