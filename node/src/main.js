const commandLineArgs = require('command-line-args');
const _ = require('lodash');
const runCommand = require('./commands/run-command');
const updateNotifier = require('update-notifier');
const pkg = require('../package.json');
const { options } = require('./config/constants');
const { commands } = require('./config/commands');
const help = require('./commands/help');
const configure = require('./commands/configure');
const logger = require('./lib/logger');

const mainDefinitions = [{ name: 'command', defaultOption: true }];

const { ENVIRONMENT_VARIABLES, SENSITIVE_ENVIRONMENT_VARIABLES, TERRAFORM_VARIABLES } = options;

const assertCommandExists = command => {
  if (!commands[command]) {
    const error = `${
      command ? `Unknown command: "${command}"` : 'Command is missing'
    } \nRun "env0 --help" to see available commands`;
    throw new Error(error);
  }
};

const logErrors = (command, error) => {
  commands[command] && logger.error(`Command ${command} has failed.`);
  let { message } = error;

  if (error.response && error.response.data) {
    message += ':\n';

    const { data } = error.response;
    if (_.isArray(data)) data.forEach(line => (message += `${line}\n`));
    else if (_.isString(data)) message += `${data}\n`;
    else if (data.message) message += `${data.message}\n`;
  }

  logger.error(message);
};

const isInternalCommand = async (command, args) => {
  let isInternalCmd = false;

  if (['-h', '--help'].some(h => args.includes(h)) || command === 'help') {
    help();
    isInternalCmd = true;
  }

  if (['--version'].some(h => args.includes(h)) || command === 'version') {
    logger.info(pkg.version);
    isInternalCmd = true;
  }

  if (command === 'configure') {
    const options = getCommandOptions(command, args);
    await configure(options);
    isInternalCmd = true;
  }

  return isInternalCmd;
};

const run = async () => {
  const mainOptions = commandLineArgs(mainDefinitions, { stopAtFirstUnknown: true });
  const argv = mainOptions._unknown || [];

  const { command } = mainOptions;

  updateNotifier({ pkg }).notify();

  try {
    if (await isInternalCommand(command, argv)) return;

    assertCommandExists(command);

    const currentCommandOptions = getCommandOptions(command, argv);

    const variables = getVariablesOptions(
      currentCommandOptions[ENVIRONMENT_VARIABLES],
      currentCommandOptions[SENSITIVE_ENVIRONMENT_VARIABLES],
      currentCommandOptions[TERRAFORM_VARIABLES]
    );

    await runCommand(command, currentCommandOptions, variables);
  } catch (error) {
    logErrors(command, error);
    process.exit(1);
  }
};

const getCommandOptions = (command, argv) => {
  const commandDefinitions = commands[command].options;
  const commandsOptions = commandLineArgs(commandDefinitions, { argv });

  return commandsOptions[command];
};

const parseVariables = (variables, sensitive, type) => {
  const result = [];

  if (variables && variables.length > 0) {
    logger.info(`Getting ${sensitive ? 'Sensitive ' : ''}${type ? 'Terraform ' : 'Environment '}variables from options.`);

    variables.forEach(config => {
      let [name, ...value] = config.split('=');
      value = value.join('=');
      result.push({ name, value, sensitive, type });
    });
  }

  return result;
};

const getVariablesOptions = (environmentVariables, sensitiveEnvironmentVariables, terraformVariables) => {
  return [
    ...parseVariables(environmentVariables, false, 0),
    ...parseVariables(sensitiveEnvironmentVariables, true, 0),
    ...parseVariables(terraformVariables, false, 1)
  ];
};

module.exports = run;
