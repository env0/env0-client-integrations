const Env0ApiClient = require('./api-client');
const logger = require('./logger');
const { options } = require('../config/constants');
const { convertStringToBoolean, removeEmptyValuesFromObj, withRetry } = require('./general-utils');
const { isEmpty } = require('lodash');

const {
  API_KEY,
  API_SECRET,
  REQUIRES_APPROVAL,
  BLUEPRINT_ID,
  REVISION,
  TARGETS,
  ENVIRONMENT_NAME,
  WORKSPACE_NAME,
  PROJECT_ID
} = options;

const apiClient = new Env0ApiClient();

class DeployUtils {
  static async init(options) {
    await apiClient.init(options[API_KEY], options[API_SECRET]);
  }

  async getEnvironment(options) {
    const { environmentName, environmentId, projectId } = options;

    if (environmentId) {
      return await apiClient.callApi('get', `environments/${environmentId}`);
    } else {
      const environments = await apiClient.callApi(
        'get',
        `environments?projectId=${projectId}&name=${environmentName}`
      );
      return isEmpty(environments) ? undefined : environments[0];
    }
  }

  async getDeployment(deploymentLogId) {
    return await apiClient.callApi('get', `environments/deployments/${deploymentLogId}`);
  }

  async getDeploymentSteps(deploymentLogId) {
    return await apiClient.callApi('get', `deployments/${deploymentLogId}/steps`);
  }

  async getDeploymentStepLog(deploymentLogId, stepName, startTime) {
    return await apiClient.callApi('get', `deployments/${deploymentLogId}/steps/${stepName}/log`, {
      params: { startTime }
    });
  }

  async updateEnvironment(environment, data) {
    await apiClient.callApi('put', `environments/${environment.id}`, { data });
  }

  async createAndDeployEnvironment(options, configurationChanges) {
    const payload = removeEmptyValuesFromObj({
      name: options[ENVIRONMENT_NAME],
      workspaceName: options[WORKSPACE_NAME],
      projectId: options[PROJECT_ID],
      deployRequest: {
        blueprintId: options[BLUEPRINT_ID],
        blueprintRevision: options[REVISION]
      },
      configurationChanges,
      requiresApproval: convertStringToBoolean(options[REQUIRES_APPROVAL])
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
    logger.info('Starting to deploy environment...');

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

  async destroyEnvironment(environment, params) {
    logger.info('Starting to destroy environment...');

    return await apiClient.callApi('post', `environments/${environment.id}/destroy`, {
      params
    });
  }

  async writeDeploymentStepLog(deploymentLogId, stepName) {
    const pollInProgressStepLogInterval = 10000; // 10 seconds
    let shouldPoll = false;
    let startTime = undefined;

    do {
      const steps = await withRetry(() => this.getDeploymentSteps(deploymentLogId));
      const { status } = steps.find(step => step.name === stepName);
      const stepInProgress = status === 'IN_PROGRESS';

      const { events, nextStartTime, hasMoreLogs } = await withRetry(() =>
        this.getDeploymentStepLog(deploymentLogId, stepName, startTime)
      );

      events.forEach(event => logger.info(event.message));

      if (nextStartTime) startTime = nextStartTime;
      if (stepInProgress) await apiClient.sleep(pollInProgressStepLogInterval);

      shouldPoll = hasMoreLogs || stepInProgress;
    } while (shouldPoll);
  }

  async processDeploymentSteps(deploymentLogId, stepsToSkip) {
    const doneSteps = [];

    const steps = await this.getDeploymentSteps(deploymentLogId);

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

  async pollDeploymentStatus(deployment, shouldProcessDeploymentSteps = true) {
    const maxTimeInSeconds = 10800; // 3 hours
    const pollStepLogsInterval = 30000; // 30 seconds
    const start = Date.now();
    const stepsAlreadyLogged = [];
    let previousStatus;

    const pollableStatuses = ['IN_PROGRESS'];
    if (deployment.status === 'QUEUED') {
      pollableStatuses.push('QUEUED');
      logger.info(`Deployment is queued! Waiting for it to start...`);
      logger.info('Note: You can always stop waiting by using Ctrl+C');
    }

    while (true) {
      const { type, status } = await withRetry(() => this.getDeployment(deployment.id));

      if (status === 'QUEUED') logger.info('Queued deployment is still waiting for earlier deployments to finish...');

      if (status === 'IN_PROGRESS' && previousStatus === 'QUEUED') {
        logger.info(`Deployment reached its turn! ${type === 'deploy' ? 'Deploying' : 'Destroying'} environment...`);
      }

      if (shouldProcessDeploymentSteps) {
        stepsAlreadyLogged.push(...(await this.processDeploymentSteps(deployment.id, stepsAlreadyLogged)));
      }

      if (!pollableStatuses.includes(status)) {
        status === 'WAITING_FOR_USER' &&
          logger.info("Deployment is waiting for an approval. Run 'env0 approve' or 'env0 cancel' to continue.");
        return status;
      }

      const elapsedTimeInSeconds = (Date.now() - start) / 1000;
      if (elapsedTimeInSeconds > maxTimeInSeconds) throw new Error('Polling deployment timed out');

      previousStatus = status;
      await apiClient.sleep(pollStepLogsInterval);
    }
  }

  assertDeploymentStatus(status) {
    if (!['SUCCESS', 'WAITING_FOR_USER', 'CANCELLED'].includes(status)) {
      throw new Error(`Deployment failed. Current deployment status is ${status}`);
    }
  }
}
module.exports = DeployUtils;
