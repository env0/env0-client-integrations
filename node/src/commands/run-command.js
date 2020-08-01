const DeployUtils = require('../utils/deploy-utils');
const configManager = require('../utils/config-manager');
const deploy = require('./deploy');
const destroy = require('./destroy');
const approve = require('./approve');
const cancel = require('./cancel');
const { assertRequiredOptions } = require('../utils/assertions');

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

  console.log('Waiting for deployment to start...');
  await commands[command](options, environmentVariables);
  console.log(`Command ${command} has finished successfully.`);
};

module.exports = runCommand;
