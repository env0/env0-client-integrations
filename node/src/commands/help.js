const commandLineUsage = require('command-line-usage');
const { commands } = require('../config/commands');
const { repository } = require('../../package.json');
const { flatMap } = require('lodash');

const buildTopLevelSections = () => {
  // Commands without spaces are top-level; those with spaces are grouped
  const topLevel = [];
  const groupedPrefixes = new Set();

  Object.keys(commands).forEach(cmd => {
    const [prefix, ...rest] = cmd.split(' ');
    if (rest.length === 0) {
      topLevel.push({
        name: cmd,
        summary: commands[cmd].help && commands[cmd].help[0] && commands[cmd].help[0].desc
      });
    } else {
      groupedPrefixes.add(prefix);
    }
  });

  groupedPrefixes.forEach(prefix => {
    if (!topLevel.find(c => c.name === prefix)) {
      topLevel.push({
        name: prefix,
        summary: `Manage ${prefix} (run \`env0 ${prefix} --help\` for subcommands)`
      });
    }
  });

  const commandOptionSections = Object.keys(commands)
    .filter(command => !command.includes(' ') && commands[command].options)
    .map(command => ({
      header: `${command} options`,
      optionList: commands[command].options
    }));

  return [
    {
      header: 'Usage',
      content: '$ env0 <command> [options]'
    },
    {
      header: 'Commands',
      content: topLevel
    },
    ...commandOptionSections,
    {
      header: 'Examples',
      content: flatMap(Object.keys(commands), command => commands[command].help || [])
    },
    {
      content: `Project home: {underline ${repository.url}}`
    }
  ];
};

const buildAgentsSections = () => {
  const agentCommands = Object.keys(commands).filter(cmd => cmd.startsWith('agents '));

  const commandOptionSections = agentCommands
    .filter(command => commands[command].options)
    .map(command => ({
      header: `${command} options`,
      optionList: commands[command].options
    }));

  return [
    {
      header: 'Usage',
      content: '$ env0 agents <command> [options]'
    },
    {
      header: 'Commands',
      content: agentCommands.map(cmd => ({
        name: cmd,
        summary: commands[cmd].help && commands[cmd].help[0] && commands[cmd].help[0].desc
      }))
    },
    ...commandOptionSections,
    {
      header: 'Examples',
      content: flatMap(agentCommands, command => commands[command].help || [])
    }
  ];
};

const help = command => {
  const isAgentsHelp = command === 'agents';
  const sections = isAgentsHelp ? buildAgentsSections() : buildTopLevelSections();
  const usage = commandLineUsage(sections);
  console.log(usage);
};

module.exports = help;
