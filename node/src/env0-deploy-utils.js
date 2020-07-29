const Env0ApiClient = require('./commons/api-client');

class DeployUtils {
  constructor() {
    this.apiClient = new Env0ApiClient();
  }

  async init(options) {
    await this.apiClient.init(options.apiKey, options.apiSecret);
  }

  async getEnvironment(environmentName, projectId) {
    const environments = await this.apiClient.callApi('get', `environments?projectId=${projectId}`);

    return environments.find(env => env.name === environmentName);
  }

  async createEnvironment(environmentName, organizationId, projectId) {
    const environment = await this.apiClient.callApi('post', 'environments', {
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
    const configurations = await this.apiClient.callApi('get', 'configuration', { params });
    const existingConfiguration = configurations.find(config => config.name === configurationName);

    if (existingConfiguration) {
      console.log(`found a configuration that matches the configurationName: ${configurationName}, existingConfiguration: ${JSON.stringify(existingConfiguration)}`);
      configuration.id = existingConfiguration.id;
    }

    console.log(`setting the following configuration: ${JSON.stringify(configuration)}`);
    await this.apiClient.callApi('post', 'configuration', {data: {...configuration, projectId: undefined}});
  }

  async deployEnvironment(environment, blueprintRevision, blueprintId) {
    await this.waitForEnvironment(environment.id);

    return await this.apiClient.callApi('post', `environments/${environment.id}/deployments`, {data: {blueprintId, blueprintRevision}});
  }

  async destroyEnvironment(environment) {
    await this.waitForEnvironment(environment.id);

    return await this.apiClient.callApi('post', `environments/${environment.id}/destroy`);
  }

  async writeDeploymentStepLog(deploymentLogId, stepName) {
    let hasMoreLogs;

    do {
      const { events, hasMoreLogs: currentHasMoreLogs } = await this.apiClient.callApi('get', `deployments/${deploymentLogId}/steps/${stepName}/log`);
      events.forEach((event) => console.log(event.message));

      hasMoreLogs = currentHasMoreLogs;
    } while (hasMoreLogs)
  }

  async processDeploymentSteps(deploymentLogId, stepsToSkip) {
    const doneSteps = [];

    const steps = await this.apiClient.callApi('get', `deployments/${deploymentLogId}/steps`);

    for (const step of steps) {
      const alreadyLogged = stepsToSkip.includes(step.name);

      if (!alreadyLogged && step.status !== 'NOT_STARTED') {
        console.log(`$$$ ${step.name}`);
        console.log('#'.repeat(100));
        await this.writeDeploymentStepLog(deploymentLogId, step.name);

        doneSteps.push(step.name);
      }
    }

    return doneSteps;
  }

  async pollDeploymentStatus(deploymentLogId) {
    const MAX_TIME_IN_SECONDS = 10800 // 3 hours
    const start = Date.now();
    let stepsAlreadyLogged = [];

    while (true) {
      const { status } = await this.apiClient.callApi('get', `environments/deployments/${deploymentLogId}`);

      stepsAlreadyLogged.push(...await this.processDeploymentSteps(deploymentLogId, stepsAlreadyLogged));

      if (status !== 'IN_PROGRESS') return;

      const elapsedTimeInSeconds = (Date.now() - start) / 1000;
      if (elapsedTimeInSeconds > MAX_TIME_IN_SECONDS) throw new Error('Polling deployment timed out');

      await this.apiClient.sleep(2000);
    }
  }

  async waitForEnvironment(environmentId) {
    const environmentValidStatuses = ['CREATED', 'ACTIVE', 'INACTIVE', 'FAILED', 'TIMEOUT'];
    const maxRetryNumber = 180; // waiting for 15 minutes (180 * 5 seconds)
    let retryCount = 0;
    let status;

    do {
      ({ status } = await this.apiClient.callApi('get', `environments/${environmentId}`));

      if (environmentValidStatuses.includes(status)) return;
      if (retryCount >= maxRetryNumber) throw new Error('Polling environment timed out');

      console.log(`Waiting for environment to become deployable. (current status: ${status})`);

      retryCount++;
      await this.apiClient.sleep(5000);
    } while (!environmentValidStatuses.includes(status));
  }

  async archiveIfInactive(environmentId) {
    const envRoute = `environments/${environmentId}`;
    const environment = await this.apiClient.callApi('get', envRoute);
    if (environment.status !== 'INACTIVE') throw new Error('Environment did not reach INACTIVE status');
    await this.apiClient.callApi('put', envRoute, { data: { isArchived: true }});
    console.log(`Environment ${environment.name} has been archived`);
  }
}
module.exports = DeployUtils;
