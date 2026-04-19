import DeployUtils from '../lib/deploy-utils.js';
import * as configManager from '../lib/config-manager.js';
import deploy from './deploy.js';
import destroy from './destroy.js';
import approve from './approve.js';
import cancel from './cancel.js';
import { options } from '../config/constants.js';
import logger from '../lib/logger.js';
import _ from 'lodash';
import { argumentsMap } from '../config/arguments.js';

const { API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID, ENVIRONMENT_NAME, REQUIRES_APPROVAL } = options;

const assertRequiredOptions = options => {
  const requiredOptions = [API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID, ENVIRONMENT_NAME];

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
  assertRequiredOptions(options);
  assertRequiresApprovalOption(options[REQUIRES_APPROVAL]);

  logger.setSecrets(options);

  logger.info(`Running ${command} with the following arguments:`);
  Object.keys(options).forEach(opt => logger.info(`$ ${opt}: ${options[opt]}`));

  const commands = {
    destroy: destroy,
    deploy: deploy,
    approve: approve,
    cancel: cancel
  };

  await DeployUtils.init(options);

  await commands[command](options, variables);
  logger.info(`Command ${command} has finished successfully.`);
};

export default runCommand;
