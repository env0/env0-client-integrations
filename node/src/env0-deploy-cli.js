const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const runCommand = require('./env0-deploy-flow');
const boxen = require('boxen');
const { OPTIONS } = require('./commons/constants');
const { version } = require('../package.json');
const { allArguments, baseArguments } = require('./commons/arguments');

const mainDefinitions = [
  { name: 'command', defaultOption: true },
];

const {
  API_KEY,
  API_SECRET,
  ORGANIZATION_ID,
  PROJECT_ID,
  BLUEPRINT_ID,
  ENVIRONMENT_NAME,
  ENVIRONMENT_VARIABLES,
  SENSITIVE_ENVIRONMENT_VARIABLES,
} = OPTIONS;

const availableCommands = {
  'deploy': {
    options: allArguments,
    description: 'Deploys an environment'
  },
  'destroy': {
    options: allArguments,
    description: 'Destroys an environment'
  },
  'approve': {
    options: baseArguments,
    description: 'Accepts a deployment that is pending approval'
  },
  'cancel': {
    options: baseArguments,
    description: 'Cancels an deployment that is pending approval'
  },
  'version': {
    description: 'Shows the CLI version'
  },
  'help': {
    description: 'Shows this help message'
  }
};

const header = `
                                  .oooo.   
                                 d8P'\`Y8b  
 .ooooo.  ooo. .oo. oooo    ooo 888    888 
d88' \`88b \`888P"Y88b \`88.  .8'  888    888 
888ooo888  888   888  \`88..8'   888    888 
888        888   888   \`888'    \`88b  d88' 
\`Y8bod8P' o888o o888o   \`8'      \`Y8bd8P'  

Self-Service Cloud Environments
`

const sections = [
  {
    content: boxen(header, {padding: 1, margin: 1, borderStyle: 'bold', align: 'center'} ),
    raw: true
  },
  {
    header: 'Example',
    content: [
      `$ env0 deploy -k <${API_KEY}> -s <${API_SECRET}> -o <${ORGANIZATION_ID}> -p <${PROJECT_ID}> -b <${BLUEPRINT_ID}> -e <${ENVIRONMENT_NAME}> -r [master] -v [stage=dev]`,
      '$ env0 --help'
    ]
  },
  {
    header: 'Commands',
    content: Object.keys(availableCommands).map(command => ({
      name: command,
      summary: availableCommands[command].description
    }))
  },
  {
    header: 'Options',
    optionList: allArguments.map(option => ({
      ...option,
    }))
  }
];

const assertCommandExists = (command) => {
  if (!availableCommands[command]) {
    const error = `${command ? `Unknown command: "${command}"` : 'Command is missing'} \nRun "env0 --help" to see available commands`;
    throw new Error(error)
  }
}

const isInternalCommand = (command, args) => {
  if (['-h', '--help'].some(h => args.includes(h)) || command === 'help') {
    const usage = commandLineUsage(sections);
    console.log(usage);
    return true;
  }

  if (['--version'].some(h => args.includes(h)) || command === 'version') {
    console.log(version);
    return true;
  }
}

const run = async () => {
  const mainOptions = commandLineArgs(mainDefinitions, { stopAtFirstUnknown: true });
  const argv = mainOptions._unknown || [];

  const { command } = mainOptions;

  try {
    if (isInternalCommand(command, argv)) return;

    assertCommandExists(command);

    const commandDefinitions = availableCommands[command].options;
    const commandOptions = commandLineArgs(commandDefinitions, { argv });
    const environmentVariables = getEnvironmentVariablesOptions(commandOptions[ENVIRONMENT_VARIABLES], commandOptions[SENSITIVE_ENVIRONMENT_VARIABLES]);

    await runCommand(command, commandOptions, environmentVariables);
  } catch (error) {
    console.error(`Command ${command} has failed. Error:`);
    let { message } = error;
    if (error.response && error.response.data && error.response.data.message) {
      message += `: ${error.response.data.message}`
    }

    console.error(message);
    process.exit(1);
  }
};


const parseEnvironmentVariables = (environmentVariables, sensitive) => {
  const result = [];

  if (environmentVariables && environmentVariables.length > 0) {
    console.log(`Getting ${sensitive ? 'Sensitive ' : ''}Environment Variables from options:`, environmentVariables);

    environmentVariables.forEach(config => {
      let [name, ...value] = config.split('=');
      value = value.join("=");
      result.push({ name, value, sensitive });
    });
  }

  return result;
}

const getEnvironmentVariablesOptions = (environmentVariables, sensitiveEnvironmentVariables) => {
  return [ ...parseEnvironmentVariables(environmentVariables, false), ...parseEnvironmentVariables(sensitiveEnvironmentVariables, true)]
};

module.exports = run;
