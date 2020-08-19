const DeployUtils = require('../lib/deploy-utils');
const logger = require('../lib/logger');
const { options } = require('../config/constants');

const { BLUEPRINT_ID, REVISION, ENVIRONMENT_NAME, PROJECT_ID } = options;

const assertBlueprintExistsOnInitialDeployment = options => {
  if (!options[BLUEPRINT_ID]) throw new Error('Missing blueprint ID on initial deployment');
  if (!options[REVISION]) throw new Error('Missing revision on initial deployment');
};

const getConfigurationChanges = environmentVariables =>
  environmentVariables.map(variable => ({
    isSensitive: variable.sensitive,
    name: variable.name,
    value: variable.value,
    scope: 'DEPLOYMENT',
    type: 0 // supporting only environment variable type ATM
  }));

const deploy = async (options, environmentVariables) => {
  const deployUtils = new DeployUtils();

  logger.info('Waiting for deployment to start...');

  const configurationChanges = getConfigurationChanges(environmentVariables);

  let deployment;
  let environment = await deployUtils.getEnvironment(options[ENVIRONMENT_NAME], options[PROJECT_ID]);

  if (!environment) {
    logger.info('Initial deployment detected');
    assertBlueprintExistsOnInitialDeployment(options);
    environment = await deployUtils.createAndDeployEnvironment(configurationChanges, options);
    deployment = await deployUtils.getDeployment(environment.latestDeploymentLogId);
  } else {
    deployment = await deployUtils.deployEnvironment(environment, configurationChanges, options);
  }

  const status = await deployUtils.pollDeploymentStatus(deployment.id);

  deployUtils.assertDeploymentStatus(status);
};

module.exports = deploy;
