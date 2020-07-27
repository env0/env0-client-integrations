const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const runDeployment = require('./env0-deploy-flow');
const { OPTIONS } = require('./commons/constants');

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
  REVISION,
  ARCHIVE_AFTER_DESTROY
} = OPTIONS;

const optionDefinitions = [
  { name: API_KEY, alias: 'k', type: String, description: 'Your env0 API Key' },
  { name: API_SECRET, alias: 's', type: String, description: 'Your env0 API Secret' },
  { name: ORGANIZATION_ID, alias: 'o', type: String, description: 'Your env0 Organization id' },
  { name: PROJECT_ID, alias: 'p', type: String, description: 'Your env0 Project id' },
  { name: BLUEPRINT_ID, alias: 'b', type: String, description: 'The Blueprint id you would like to deploy' },
  { name: ENVIRONMENT_NAME, alias: 'e', type: String, description: 'The environment name you would like to create, if it exists it will deploy to that environment' },
  { name: ENVIRONMENT_VARIABLES, alias: 'v', type: String, multiple: true, defaultValue: [], description: 'The environment variables to set on the deployed environment - works only on deploy and can be multiple, the format is "environmentVariableName1=value"' },
  { name: SENSITIVE_ENVIRONMENT_VARIABLES, alias: 'q', type: String, multiple: true, defaultValue: [], description: 'The sensitive environment variables to set on the deployed environment - works only on deploy and can be multiple, the format is "environmentVariableName1=value"' },
  { name: REVISION, alias: 'r', type: String, defaultValue: 'master', description: 'Your git revision, can be a branch tag or a commit hash. Default value "master" ' },
  { name: ARCHIVE_AFTER_DESTROY, type: Boolean, defaultValue: false, description: 'Archive the environment after a successful destroy' },
];

const availableCommands = {
  'deploy': {
    options: optionDefinitions,
    description: 'Deploys an environment'
  },
  'destroy': {
    options: optionDefinitions,
    description: 'Destroys an environment'
  },
  'help': {
    description: 'Shows this help message'
  }
};

const header = `
     ///(((///*****    ,,,,*                                                               ,%%%%%%%%%%%,
     ///(((///*****    ,,,,*                                                              #%%*       /%%/
                                                                                          %%%         #%%
                                     .#%%%%%%(       .%%* (%%%%%#.     #%%         #%%    %%%         #%%
        .                          #%%%*..../%%%,    .%%%%(,..,(%%%,    %%(       .%%*    %%%         #%%
     ///((    //***    **,,,       %%/        %%%    .%%/        %%%    *%%       %%%     %%%  ****   #%%
     ///((    //***    **,,,      .%%,        #%%    .%%,        %%%     #%%     /%%      %%%  ****   #%%
     ///((                        .%%%%%%%%%%%%%%    .%%,        %%%      %%,    %%.      %%%         #%%
     ///((                        .%%*               .%%,        %%%      *%%   #%%       %%%         #%%
     ///((    **********,,,*      .%%*               .%%,        %%%       %%% /%%        %%%         %%%
     ///((    **********,,,*       %%%               .%%,        %%%        %%.%%*        (%%#       %%%,
     ///((    **********,,,*        .%%%%%%%%%%%%    .%%,        %%%        /%%%%           #%%%%%%%%%#
                                                                                                             `;

const sections = [
  {
    content: header,
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
      const environmentVariables = getEnvironmentVariablesOptions(commandOptions[ENVIRONMENT_VARIABLES], commandOptions[SENSITIVE_ENVIRONMENT_VARIABLES]);

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
