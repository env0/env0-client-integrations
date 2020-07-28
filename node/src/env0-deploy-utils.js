const Env0ApiClient = require('./commons/api-client');

const apiClient = new Env0ApiClient();

class DeployUtils {
  static async init(options) {
    await apiClient.init(options.apiKey, options.apiSecret);
  }

  async getEnvironment(environmentName, projectId) {
    console.log(`getting all environments projectId: ${projectId}`);
    const environments = await apiClient.callApi('get', `environments?projectId=${projectId}`);
    const environment = environments.find(env => env.name === environmentName);
    console.log(`returning this environment: ${JSON.stringify(environment)}`);
    return environment;
  }

  async createEnvironment(environmentName, organizationId, projectId) {
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
  }

  async setConfiguration(environment, blueprintId, configurationName, configurationValue, isSensitive) {
    const configuration = {
      isSensitive,
      name: configurationName,
      organizationId: environment.organizationId,
      scope: "ENVIRONMENT",
      scopeId: environment.id,
      type: 0,
      value: configurationValue
    };

    console.log(`getting configuration for environmentId: ${environment.id}`);
    const params = { organizationId: environment.organizationId, blueprintId, environmentId: environment.id };
    const configurations = await apiClient.callApi('get', 'configuration', { params });
    const existingConfiguration = configurations.find(config => config.name === configurationName);

    if (existingConfiguration) {
      console.log(`found a configuration that matches the configurationName: ${configurationName}, existingConfiguration: ${JSON.stringify(existingConfiguration)}`);
      configuration.id = existingConfiguration.id;
    }

    console.log(`setting the following configuration: ${JSON.stringify(configuration)}`);
    await apiClient.callApi('post', 'configuration', {data: {...configuration, projectId: undefined}});
  }

  async deployEnvironment(environment, blueprintRevision, blueprintId) {
    await this.waitForEnvironment(environment.id);

    console.log(`starting to deploy environmentId: ${environment.id}, blueprintId: ${blueprintId}`);
    const deployment = await apiClient.callApi('post', `environments/${environment.id}/deployments`,
        {data: {blueprintId, blueprintRevision}});

    console.log(`Started deployment ${deployment.id}`);

    return deployment;
  }

  async destroyEnvironment(environment) {
    await this.waitForEnvironment(environment.id);

    console.log(`Starting to destroy environmentId: ${environment.id}`);
    const deployment = await apiClient.callApi('post', `environments/${environment.id}/destroy`);
    console.log(`Started destroy ${deployment.id}`);

    return deployment;
  }

  async writeDeploymentStepLog(deploymentLogId, stepName) {
    let hasMoreLogs;

    do {
      ({ hasMoreLogs, events } = await apiClient.callApi('get', `deployments/${deploymentLogId}/steps/${stepName}/log`));
      events.forEach((event) => console.log(event.message));

      await apiClient.sleep(1000);
    } while (hasMoreLogs)
  }

  async pollDeploymentStatus(deploymentLogId) {
    const inProgressStepStatuses = ['IN_PROGRESS', 'NOT_STARTED'];
    const stepsAlreadyLogged = [];
    const maxRetryNumber = 200;
    let retryCount = 0;

    while (true) {
      console.log(`Fetching deployment log...`)
      const { status } = await apiClient.callApi('get', `environments/deployments/${deploymentLogId}`);

      if (status !== 'IN_PROGRESS') {
        console.debug(`Environment has reached status ${status}`);
        return;
      }
      if (retryCount >= maxRetryNumber) throw new Error('Polling deployment log timed out');

      console.debug(`Fetching deployment steps...`);
      const steps = await apiClient.callApi('get', `deployments/${deploymentLogId}/steps`);

      for (const step of steps) {
        console.debug(`Inspecting step ${step.name}`);
        const alreadyLogged = stepsAlreadyLogged.includes(step.name);
        const inProgress = inProgressStepStatuses.includes(step.status);

        if (!alreadyLogged && !inProgress) {
          console.debug(`Fetching logs of step ${step.name} since its status is ${step.status}`);
          await this.writeDeploymentStepLog(deploymentLogId, step.name);
          stepsAlreadyLogged.push(step.name);
        }
      }

      retryCount++;
      await apiClient.sleep(2000);
    }
  }

  async waitForEnvironment(environmentId) {
    const environmentValidStatuses = ['CREATED', 'ACTIVE', 'INACTIVE', 'FAILED', 'TIMEOUT'];
    const maxRetryNumber = 180; // waiting for 15 minutes (180 * 5 seconds)
    let retryCount = 0;
    let status;

    do {
      console.debug('Checking if environment is in deployable...');
      ({ status } = await apiClient.callApi('get', `environments/${environmentId}`));

      if (environmentValidStatuses.includes(status)) return;
      if (retryCount >= maxRetryNumber) throw new Error('Polling environment timed out');

      console.log(`Waiting for environment to become deployable... (current status: ${status})`);

      retryCount++;
      await apiClient.sleep(5000);
    } while (!environmentValidStatuses.includes(status));
  }

  async archiveIfInactive(environmentId) {
    const envRoute = `environments/${environmentId}`;
    const environment = await apiClient.callApi('get', envRoute);
    if (environment.status !== 'INACTIVE') throw new Error('Environment did not reach INACTIVE status');
    await apiClient.callApi('put', envRoute, { data: { isArchived: true }});
    console.log(`Environment ${environment.name} has been archived`);
  }
}
module.exports = DeployUtils;
