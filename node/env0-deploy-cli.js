const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const runDeployment = require('./env0-deploy-flow');

const optionDefinitions = [
  { name: 'apiKey', alias: 'k', type: String, description: 'Your env0 API Key' },
  { name: 'apiSecret', alias: 's', type: String, description: 'Your env0 API Secret' },
  { name: 'action', alias: 'a', type: String, description: 'The action you would like to perform - can be deploy/destroy' },
  { name: 'organizationId', alias: 'o', type: String, description: 'Your env0 Organization id' },
  { name: 'projectId', alias: 'p', type: String, description: 'Your env0 Project id' },
  { name: 'blueprintId', alias: 'b', type: String, description: 'The Blueprint id you would like to deploy' },
  { name: 'environmentName', alias: 'e', type: String, description: 'The environment name you would like to create, if it exists it will deploy to that environment' },
  { name: 'environmentVariables', alias: 'v', type: String, multiple: true, defaultValue: [], description: 'The environment variables to set on the deployed environment - works only on deploy and can be multiple, the format is "environmentVariableName1=value"' },
  { name: 'revision', alias: 'r', type: String, defaultValue: 'master', description: 'Your git revision, can be a branch tag or a commit hash. Default value "master" ' },
  { name: 'archiveAfterDestroy',  type: Boolean, defaultValue: false, description: 'Archive the environment after a successful destroy' },
  { name: 'help', alias: 'h', type: Boolean, defaultValue: false, description: 'Get help' }
];

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

const sections = [{
    content: header,
    raw: true
  },
  {
    header: 'env0 cli example',
    content: [
      `$ node env0-deploy-cli.js -k <apiKey> -s <apiSecret> -a <deploy> -o <organizationId> -p <projectId> -b <blueprintId> -e <environmentName> -r [master] -v [stage=dev]`,
      '$ node env0-deploy-cli.js --help'
    ]
  },
  {
    header: 'Options'
  }
];

optionDefinitions.forEach((option) => {
  const alias = option.alias ? `-${option.alias}` : '';
  sections.push({
    content: `{bold ${alias} --${option.name}} - {italic ${option.description}}`
  })
});

const usage = commandLineUsage(sections);
const options = commandLineArgs(optionDefinitions);

const run = async () => {
  try {
    if (options.help) {
      console.log(usage);
    }
    else {
      const environmentVariables = getEnvironmentVariablesOptions(options.environmentVariables);
      console.log('running deployment with the following arguments:', options);
      await runDeployment(options, environmentVariables);
    }
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

const getEnvironmentVariablesOptions = (environmentVariables) => {
  const result = [];
  if (environmentVariables && environmentVariables.length > 0) {
    console.log('getting Environment Variables from options:', environmentVariables);
    environmentVariables.forEach(config => {
      let [name, ...value] = config.split('=');
      value = value.join("=");
      result.push({ name, value });
    });
  }
  return result;
};

run();
