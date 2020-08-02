const { allArguments, baseArguments } = require('./arguments');

const commands = {
  deploy: {
    options: allArguments,
    description: 'Deploys an environment'
  },
  destroy: {
    options: allArguments,
    description: 'Destroys an environment'
  },
  approve: {
    options: baseArguments,
    description: 'Accepts a deployment that is pending approval'
  },
  cancel: {
    options: baseArguments,
    description: 'Cancels an deployment that is pending approval'
  },
  configure: {
    description: 'Configures AWS  CLI  options'
  },
  version: {
    description: 'Shows the CLI version'
  },
  help: {
    description: 'Shows this help message'
  }
};

module.exports = { commands };
