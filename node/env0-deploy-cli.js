const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const runDeployment = require('./env0-deploy-flow');

const optionDefinitions = [
  { name: 'apiKey', alias: 'k', type: String, description: 'Your env0 API Key' },
  { name: 'apiSecret', alias: 's', type: String, description: 'Your env0 API Secret' },
  { name: 'action', alias: 'a', type: String, description: 'The action you would like to perform - can be Deploy/Destroy' },
  { name: 'organizationId', alias: 'o', type: String, description: 'Your env0 Organization id' },
  { name: 'projectId', alias: 'p', type: String, description: 'Your env0 Project id' },
  { name: 'blueprintId', alias: 'b', type: String, description: 'The Blueprint id you would like to deploy with' },
  { name: 'environmentName', alias: 'e', type: String, description: 'The environment name you would like to create, if it exists it will deploy to that environment' },
  { name: 'environmentVariables', alias: 'ce', type: String, multiple: true, description: 'The environment variables to set on the deployed environment - works only on deploy and can be multiple, the format is \"environmentVariableName1=value\"' },
  { name: 'revision', alias: 'r', type: String, defaultValue: 'master', description: 'You git revision, can be a branch tag or a commit hash. Default value \"master\" ' },
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
      '$ node env0-deploy-cli.js -a Deploy -e dev -k apiKey -s apiSecret -b blueprintId -o organizationId -p projectId -r master',
      '$ node env0-deploy-cli.js --help'
    ]
  },
  {
    header: 'Options'
  }
];

optionDefinitions.forEach((option) => {
  sections.push({
    content: `{bold -${option.alias} --${option.name}} - {italic ${option.description}}`
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
      console.log(`running deployment with the following arguments`);
      console.log(options);
      await runDeployment(options);
    }
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

run();
