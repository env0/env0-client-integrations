const Env0ApiClient = require('./api-client');

const apiClient = new Env0ApiClient();
const configurationName = 'TF_VAR_stage';
let organizationId;
let projectId;
let blueprintId;

const createAndDeploy = async (environmentName, blueprintRevision) => {
  console.log('Starting deployment');
  let environment = await getEnvironment(environmentName);
  console.log(`got the following environment: ${JSON.stringify(environment)}`);

  if (!environment) {
    console.log('did not find an environment');
    environment = await createEnvironment(environmentName);
  }

  await setConfiguration(environment);
  await pollEnvironmentStatus(environment.id);
  await deployEnvironment(environment, blueprintRevision);
  await pollEnvironmentStatus(environment.id);
};

const destroy = async (environmentName) => {
  console.log('Starting destroying an environment');
  const environment = await getEnvironment(environmentName);
  console.log(`got the following environment: ${JSON.stringify(environment)}`);

  if (environment) {
    await pollEnvironmentStatus(environment.id);
    await destroyEnvironment(environment);
    await pollEnvironmentStatus(environment.id);
  } else {
    console.log(`No environment found with the name`)
  }
};

const getEnvironment = async (environmentName) => {
  console.log(`getting all environments organizationId: ${organizationId}`);
  const environments = await apiClient.callApi('get', `environments?organization=${organizationId}`);
  const environment = environments.find(env => env.name === environmentName);
  console.log(`returning this environment: ${JSON.stringify(environment)}`);
  return environment;
};

const createEnvironment = async (environmentName) => {
  const environment = await apiClient.callApi('post', 'environments', {
    data: {
      name: environmentName,
      organizationId: organizationId,
      projectId: projectId,
      lifespanEndAt: null
    }
  });
  console.log(`Created environment ${environment.id}`);
  return environment;
};

const setConfiguration = async (environment) => {
  const configuration = {
    isSensitive: false,
    name: configurationName,
    organizationId: organizationId,
    scope: 2,
    scopeId: environment.id,
    type: 0,
    value: environment.name
  };

  console.log(`getting configuration for environmentId: ${environment.id}`);
  const configurations = await apiClient.callApi('get', `configuration?organizationId=${organizationId}&blueprintId=${blueprintId}&environmentId=${environment.id}`);
  const existingConfiguration = configurations.find(config => config.name === configurationName);

  if (existingConfiguration) {
    console.log(`found a configuration that matches the configurationName: ${configurationName}, existingConfiguration: ${JSON.stringify(existingConfiguration)}`);
    configuration.id = existingConfiguration.id;
  }

  console.log(`setting the following configuration: ${JSON.stringify(configuration)}`);
  await apiClient.callApi('post', 'configuration', { data: configuration });
};

const deployEnvironment = async (environment, blueprintRevision) => {
  console.log(`starting to deploy environmentId: ${environment.id}, blueprintId: ${blueprintId}`);
  const deployment = await apiClient.callApi('post', `environments/${environment.id}/deployments`,
    { data: { blueprintId, blueprintRevision } });

  console.log(`Started deployment ${deployment.id}`);
};

const destroyEnvironment = async (environment) => {
  console.log(`Starting to destroy environmentId: ${environment.id}, blueprintId: ${blueprintId}`);
  const deployment = await apiClient.callApi('delete', `environments/deployments/${environment.latestDeploymentLogId}`);
  console.log(`Started destroy ${deployment.id}`);
};

const pollEnvironmentStatus = async (environmentId) => {
  const deployEndStatuses = ['CREATED', 'ACTIVE', 'INACTIVE', 'FAILED', 'TIMEOUT'];
  const maxRetryNumber = 90; //waiting for 15 minutes (90 * 10 seconds)
  let retryCount = 0;
  let isDeployingInProgress = true;

  console.log(`Starting status polling for environment status for ${environmentId}, maxRetryNumber: ${maxRetryNumber}`);
  while (isDeployingInProgress) {
    await apiClient.sleep(10000);
    const environment = await apiClient.callApi('get', `environments/${environmentId}`);
    isDeployingInProgress = (!deployEndStatuses.includes(environment.status) && (retryCount < maxRetryNumber));
    retryCount++;
    console.log(`isDeployingInProgress: ${isDeployingInProgress}, retryCount: ${retryCount}, environmentStatus: ${environment.status}`);
  }
  console.log(`poll environment done, retryCount: ${retryCount}`);
};

const runDeployment = async (options) => {
  organizationId = options.organizationId;
  blueprintId = options.blueprintId;
  projectId = options.projectId;
  await apiClient.init(options.apiKey, options.apiSecret);
  if (options.action === 'Deploy') {
    await createAndDeploy(options.environmentName, options.revision);
  }
  else if (options.action === 'Destroy') {
    await destroy(options.environmentName);
  }
  else {
    throw new Error(`Action ${action} is Invalid, Valid actions are Deploy and Destroy`);
  }
};

module.exports = runDeployment;