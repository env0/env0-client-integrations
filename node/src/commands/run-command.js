const DeployUtils = require('../lib/deploy-utils');
const configManager = require('../lib/config-manager');
const deploy = require('./deploy');
const destroy = require('./destroy');
const approve = require('./approve');
const cancel = require('./cancel');
const { options } = require('../config/constants');

const { API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID, ENVIRONMENT_NAME } = options;

const assertRequiredOptions = options => {
  const requiredOptions = [API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID, ENVIRONMENT_NAME];

  let missingOptions = [];
  requiredOptions.forEach(opt => !Object.keys(options).includes(opt) && missingOptions.push(opt));

  if (missingOptions.length) {
    throw new Error(`Missing required options: ${missingOptions}`);
  }
};

const runCommand = async (command, options, environmentVariables) => {
  options = configManager.read(options);
  assertRequiredOptions(options);
  configManager.write(options);

  console.log(`Running ${command} with the following arguments:`);
  Object.keys(options).forEach(opt => console.log(`$ ${opt}: ${options[opt]}`));

  const commands = {
    destroy: destroy,
    deploy: deploy,
    approve: approve,
    cancel: cancel
  };

  await DeployUtils.init(options);

  await commands[command](options, environmentVariables);
  console.log(`Command ${command} has finished successfully.`);
};

module.exports = runCommand;
