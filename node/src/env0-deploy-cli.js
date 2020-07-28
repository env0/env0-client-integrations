const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const runDeployment = require('./env0-deploy-flow');
const boxen = require('boxen');

const mainDefinitions = [
  { name: 'command', defaultOption: true },
];

const optionDefinitions = [
  { name: 'apiKey', alias: 'k', type: String, description: 'Your env0 API Key' },
  { name: 'apiSecret', alias: 's', type: String, description: 'Your env0 API Secret' },
  { name: 'organizationId', alias: 'o', type: String, description: 'Your env0 Organization id' },
  { name: 'projectId', alias: 'p', type: String, description: 'Your env0 Project id' },
  { name: 'blueprintId', alias: 'b', type: String, description: 'The Blueprint id you would like to deploy' },
  { name: 'environmentName', alias: 'e', type: String, description: 'The environment name you would like to create, if it exists it will deploy to that environment' },
  { name: 'environmentVariables', alias: 'v', type: String, multiple: true, defaultValue: [], description: 'The environment variables to set on the deployed environment - works only on deploy and can be multiple, the format is "environmentVariableName1=value"' },
  { name: 'sensitiveEnvironmentVariables', alias: 'q', type: String, multiple: true, defaultValue: [], description: 'The sensitive environment variables to set on the deployed environment - works only on deploy and can be multiple, the format is "environmentVariableName1=value"' },
  { name: 'revision', alias: 'r', type: String, defaultValue: 'master', description: 'Your git revision, can be a branch tag or a commit hash. Default value "master" ' },
  { name: 'archiveAfterDestroy',  type: Boolean, defaultValue: false, description: 'Archive the environment after a successful destroy' },
];

const availableCommands = {
  'deploy': {
    options: optionDefinitions,
    description: 'Deploy an environment'
  },
  'destroy': {
    options: optionDefinitions,
    description: 'Destroy an environment'
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
      `$ env0 deploy -k <apiKey> -s <apiSecret> -o <organizationId> -p <projectId> -b <blueprintId> -e <environmentName> -r [master] -v [stage=dev]`,
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
    optionList: optionDefinitions.map(option => ({
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

const isCallingForHelp = (command, args) => {
  const HELP_ARGS = ['-h', '--help'];

  return HELP_ARGS.some(h => args.includes(h)) || command === 'help'
}

const run = async () => {
  const mainOptions = commandLineArgs(mainDefinitions, { stopAtFirstUnknown: true });
  const argv = mainOptions._unknown || [];

  try {
    const { command } = mainOptions;

    if (isCallingForHelp(command, argv)) {
      const usage = commandLineUsage(sections);
      console.log(usage);
    } else {
      assertCommandExists(command);

      const commandDefinitions = availableCommands[command].options;
      const commandOptions = commandLineArgs(commandDefinitions, { argv });
      const environmentVariables = getEnvironmentVariablesOptions(commandOptions.environmentVariables, commandOptions.sensitiveEnvironmentVariables);

      await runDeployment(command, commandOptions, environmentVariables);
    }
  } catch (error) {
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
