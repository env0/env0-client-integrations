import commandLineUsage from 'command-line-usage';
import boxen from 'boxen';
import { allArguments } from '../config/arguments.js';
import { commands } from '../config/commands.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { repository } = require('../../package.json');
import _ from 'lodash';

const header = `
                                  .oooo.
                                 d8P'\`Y8b
 .ooooo.  ooo. .oo. oooo    ooo 888    888
d88' \`88b \`888P"Y88b \`88.  .8'  888    888
888ooo888  888   888  \`88..8'   888    888
888        888   888   \`888'    \`88b  d88'
\`Y8bod8P' o888o o888o   \`8'      \`Y8bd8P'

Self-Service Cloud Environments
https://www.env0.com
`;

const options = Object.keys(commands)
  .filter(command => commands[command].options)
  .map(command => ({
    header: `${command} options`,
    optionList: allArguments.map(option => ({
      ...option
    })),
    group: [command]
  }));

const sections = [
  {
    content: boxen(header, { padding: 1, margin: 1, borderStyle: 'bold', align: 'center' }),
    raw: true
  },
  {
    header: 'Available Commands',
    content: Object.keys(commands).map(command => ({
      name: command,
      summary: commands[command].description
    }))
  },
  ...options,
  {
    header: 'Examples',
    content: _.flatMap(Object.keys(commands), command => commands[command].help)
  },
  {
    content: `Project home: {underline ${repository.url}}`
  }
];

const help = () => {
  const usage = commandLineUsage(sections);
  console.log(usage);
};

export default help;
