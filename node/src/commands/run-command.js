const DeployUtils = require('../lib/deploy-utils');
const configManager = require('../lib/config-manager');
const { commands } = require('../config/commands');
const { options } = require('../config/constants');
const logger = require('../lib/logger');
const _ = require('lodash');
const { argumentsMap } = require('../config/arguments');

const { API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID, ENVIRONMENT_NAME, REQUIRES_APPROVAL } = options;

const assertRequiredOptions = (command, options) => {
  const defaultRequiredOptions = [API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID, ENVIRONMENT_NAME];
  const commandConfig = commands[command] || {};
  const requiredOptions = commandConfig.requiredOptions || defaultRequiredOptions;

  let missingOptions = [];
  requiredOptions.forEach(opt => !Object.keys(options).includes(opt) && missingOptions.push(opt));

  if (missingOptions.length) {
    throw new Error(`Missing required options: ${missingOptions}`);
  }
};

const assertRequiresApprovalOption = requiresApproval => {
  const validValues = ['true', 'false'];

  if (!_.isUndefined(requiresApproval) && !validValues.includes(requiresApproval)) {
    throw Error(
      `Bad argument received. --${REQUIRES_APPROVAL} (-${argumentsMap[REQUIRES_APPROVAL].alias}) can be either "true" or "false".`
    );
  }
};

const runCommand = async (command, options, variables) => {
  options = configManager.read(options);
  assertRequiredOptions(command, options);
  assertRequiresApprovalOption(options[REQUIRES_APPROVAL]);

  logger.setSecrets(options);

  logger.info(`Running ${command} with the following arguments:`);
  Object.keys(options).forEach(opt => logger.info(`$ ${opt}: ${options[opt]}`));

  const commandConfig = commands[command];

  if (commandConfig && commandConfig.useDeployUtils) {
    await DeployUtils.init(options);
  }

  await commandConfig.handler(options, variables);
  logger.info(`Command ${command} has finished successfully.`);
};

module.exports = runCommand;
