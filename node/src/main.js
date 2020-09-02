const commandLineArgs = require('command-line-args');
const runCommand = require('./commands/run-command');
const updateNotifier = require('update-notifier');
const pkg = require('../package.json');
const { options } = require('./config/constants');
const { commands } = require('./config/commands');
const help = require('./commands/help');
const configure = require('./commands/configure');
const logger = require('./lib/logger');

const mainDefinitions = [{ name: 'command', defaultOption: true }];

const { ENVIRONMENT_VARIABLES, SENSITIVE_ENVIRONMENT_VARIABLES } = options;

const assertCommandExists = command => {
  if (!commands[command]) {
    const error = `${
      command ? `Unknown command: "${command}"` : 'Command is missing'
    } \nRun "env0 --help" to see available commands`;
    throw new Error(error);
  }
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
    await configure();
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

    const commandDefinitions = commands[command].options;
    const commandsOptions = commandLineArgs(commandDefinitions, { argv });

    const currentCommandOptions = commandsOptions[command];

    const environmentVariables = getEnvironmentVariablesOptions(
      currentCommandOptions[ENVIRONMENT_VARIABLES],
      currentCommandOptions[SENSITIVE_ENVIRONMENT_VARIABLES]
    );

    await runCommand(command, currentCommandOptions, environmentVariables);
  } catch (error) {
    commands[command] && logger.error(`Command ${command} has failed. Error:`);
    let { message } = error;
    if (error.response && error.response.data && error.response.data.message) {
      message += `: ${error.response.data.message}`;
    }

    logger.error(message);
    process.exit(1);
  }
};

const parseEnvironmentVariables = (environmentVariables, sensitive) => {
  const result = [];

  if (environmentVariables && environmentVariables.length > 0) {
    logger.info(`Getting ${sensitive ? 'Sensitive ' : ''}Environment Variables from options:`, environmentVariables);

    environmentVariables.forEach(config => {
      let [name, ...value] = config.split('=');
      value = value.join('=');
      result.push({ name, value, sensitive });
    });
  }

  return result;
};

const getEnvironmentVariablesOptions = (environmentVariables, sensitiveEnvironmentVariables) => {
  return [
    ...parseEnvironmentVariables(environmentVariables, false),
    ...parseEnvironmentVariables(sensitiveEnvironmentVariables, true)
  ];
};

module.exports = run;
