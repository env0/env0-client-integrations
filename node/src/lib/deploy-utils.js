const Env0ApiClient = require('./api-client');
const logger = require('./logger');
const { options } = require('../config/constants');
const { convertStringToBoolean, removeEmptyValuesFromObj } = require('./general-utils');

const {
  API_KEY,
  API_SECRET,
  REQUIRES_APPROVAL,
  BLUEPRINT_ID,
  REVISION,
  TARGETS,
  ENVIRONMENT_NAME,
  ORGANIZATION_ID,
  PROJECT_ID
} = options;

const apiClient = new Env0ApiClient();

class DeployUtils {
  static async init(options) {
    await apiClient.init(options[API_KEY], options[API_SECRET]);
  }

  async getEnvironment(environmentName, projectId) {
    const environments = await apiClient.callApi('get', `environments?projectId=${projectId}`);

    return environments.find(env => env.name === environmentName);
  }

  async getDeployment(deploymentLogId) {
    return await apiClient.callApi('get', `environments/deployments/${deploymentLogId}`);
  }

  async updateEnvironment(environment, data) {
    await apiClient.callApi('put', `environments/${environment.id}`, { data });
  }

  async createAndDeployEnvironment(options, configurationChanges) {
    const payload = removeEmptyValuesFromObj({
      name: options[ENVIRONMENT_NAME],
      organizationId: options[ORGANIZATION_ID],
      projectId: options[PROJECT_ID],
      lifespanEndAt: null,
      deployRequest: {
        blueprintId: options[BLUEPRINT_ID],
        blueprintRevision: options[REVISION]
      },
      configurationChanges
    });

    return await apiClient.callApi('post', 'environments', { data: payload }); // returns the newly created environment with updated deployment log
  }

  async approveDeployment(deploymentLogId) {
    await apiClient.callApi('put', `environments/deployments/${deploymentLogId}`);
  }

  async cancelDeployment(deploymentLogId) {
    await apiClient.callApi('put', `environments/deployments/${deploymentLogId}/cancel`);
  }

  async deployEnvironment(environment, options, configurationChanges) {
    await this.waitForEnvironment(environment.id);

    const payload = removeEmptyValuesFromObj({
      blueprintRevision: options[REVISION],
      userRequiresApproval: convertStringToBoolean(options[REQUIRES_APPROVAL]),
      targets: options[TARGETS],
      configurationChanges
    });

    return await apiClient.callApi('post', `environments/${environment.id}/deployments`, {
      data: payload
    });
  }

  async destroyEnvironment(environment) {
    await this.waitForEnvironment(environment.id);

    return await apiClient.callApi('post', `environments/${environment.id}/destroy`);
  }

  async writeDeploymentStepLog(deploymentLogId, stepName) {
    let shouldPoll = false;
    let startTime = undefined;

    do {
      const steps = await apiClient.callApi('get', `deployments/${deploymentLogId}/steps`);
      const { status } = steps.find(step => step.name === stepName);
      const stepInProgress = status === 'IN_PROGRESS';

      const { events, nextStartTime, hasMoreLogs } = await apiClient.callApi(
        'get',
        `deployments/${deploymentLogId}/steps/${stepName}/log`,
        { params: { startTime } }
      );

      events.forEach(event => logger.info(event.message));

      if (nextStartTime) startTime = nextStartTime;
      if (stepInProgress) await apiClient.sleep(1000);

      shouldPoll = hasMoreLogs || stepInProgress;
    } while (shouldPoll);
  }

  async processDeploymentSteps(deploymentLogId, stepsToSkip) {
    const doneSteps = [];

    const steps = await apiClient.callApi('get', `deployments/${deploymentLogId}/steps`);

    for (const step of steps) {
      const alreadyLogged = stepsToSkip.includes(step.name);

      if (!alreadyLogged && step.status !== 'NOT_STARTED') {
        logger.info(`$$$ ${step.name}`);
        logger.info('#'.repeat(100));
        await this.writeDeploymentStepLog(deploymentLogId, step.name);

        doneSteps.push(step.name);
      }
    }

    return doneSteps;
  }

  async pollDeploymentStatus(deploymentLogId, shouldProcessDeploymentSteps = true) {
    const MAX_TIME_IN_SECONDS = 10800; // 3 hours
    const start = Date.now();
    const stepsAlreadyLogged = [];

    while (true) {
      const { status } = await apiClient.callApi('get', `environments/deployments/${deploymentLogId}`);

      if (shouldProcessDeploymentSteps) {
        stepsAlreadyLogged.push(...(await this.processDeploymentSteps(deploymentLogId, stepsAlreadyLogged)));
      }

      if (status !== 'IN_PROGRESS') {
        status === 'WAITING_FOR_USER' &&
          logger.info("Deployment is waiting for an approval. Run 'env0 approve' or 'env0 cancel' to continue.");
        return status;
      }

      const elapsedTimeInSeconds = (Date.now() - start) / 1000;
      if (elapsedTimeInSeconds > MAX_TIME_IN_SECONDS) throw new Error('Polling deployment timed out');

      await apiClient.sleep(2000);
    }
  }

  async waitForEnvironment(environmentId) {
    const environmentValidStatuses = ['CREATED', 'ACTIVE', 'INACTIVE', 'FAILED', 'TIMEOUT', 'CANCELLED', 'ABORTED'];

    const maxRetryNumber = 180; // waiting for 15 minutes (180 * 5 seconds)
    let retryCount = 0;
    let status;

    do {
      ({ status } = await apiClient.callApi('get', `environments/${environmentId}`));

      if (status === 'WAITING_FOR_USER') {
        throw new Error("Deployment is waiting for an approval. Run 'env0 approve' or 'env0 cancel' to continue.");
      }

      if (environmentValidStatuses.includes(status)) return;
      if (retryCount >= maxRetryNumber) throw new Error('Polling environment timed out');

      logger.info(`Waiting for environment to become deployable. (current status: ${status})`);

      retryCount++;
      await apiClient.sleep(5000);
    } while (!environmentValidStatuses.includes(status));
  }

  assertDeploymentStatus(status) {
    if (!['SUCCESS', 'WAITING_FOR_USER', 'CANCELLED'].includes(status)) {
      throw new Error(`Deployment failed. Current deployment status is ${status}`);
    }
  }
}
module.exports = DeployUtils;
