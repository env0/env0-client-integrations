const commandLineUsage = require('command-line-usage');
const boxen = require('boxen');
const { allArguments } = require('../config/arguments');
const { commands } = require('../config/commands');
const { options } = require('../config/constants');

const { API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID, ENVIRONMENT_NAME, BLUEPRINT_ID } = options;

const header = `
                                  .oooo.   
                                 d8P'\`Y8b  
 .ooooo.  ooo. .oo. oooo    ooo 888    888 
d88' \`88b \`888P"Y88b \`88.  .8'  888    888 
888ooo888  888   888  \`88..8'   888    888 
888        888   888   \`888'    \`88b  d88' 
\`Y8bod8P' o888o o888o   \`8'      \`Y8bd8P'  

Self-Service Cloud Environments
`;

const sections = [
  {
    content: boxen(header, { padding: 1, margin: 1, borderStyle: 'bold', align: 'center' }),
    raw: true
  },
  {
    header: 'Usage',
    content: [
      `$ env0 deploy -k <${API_KEY}> -s <${API_SECRET}> -o <${ORGANIZATION_ID}> -p <${PROJECT_ID}> -b <${BLUEPRINT_ID}> -e <${ENVIRONMENT_NAME}> -r [master] -v [stage=dev]`,
      '$ env0 --help'
    ]
  },
  {
    header: 'Available Commands',
    content: Object.keys(commands).map(command => ({
      name: command,
      summary: commands[command].description
    }))
  },
  {
    header: 'Options',
    optionList: allArguments.map(option => ({
      ...option
    }))
  }
];

const help = () => {
  const usage = commandLineUsage(sections);
  console.log(usage);
};

module.exports = help;
