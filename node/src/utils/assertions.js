const { options } = require('../config/constants');

const { API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID, ENVIRONMENT_NAME } = options;

const assertDeploymentStatus = status => {
  if (!['SUCCESS', 'WAITING_FOR_USER', 'CANCELLED'].includes(status)) {
    throw new Error(`Deployment failed. Current deployment status is ${status}`);
  }
};

const assertRequiredOptions = options => {
  const requiredOptions = [API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID, ENVIRONMENT_NAME];

  let missingOptions = [];
  requiredOptions.forEach(opt => !Object.keys(options).includes(opt) && missingOptions.push(opt));

  if (missingOptions.length) {
    throw new Error(`Missing required options: ${missingOptions}`);
  }
};

module.exports = {
  assertRequiredOptions,
  assertDeploymentStatus
};
