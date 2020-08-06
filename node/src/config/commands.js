const { argumentsMap, allArguments, baseArguments } = require('./arguments');
const { options } = require('./constants');

const { REQUIRES_APPROVAL, REVISION, ENVIRONMENT_VARIABLES, SENSITIVE_ENVIRONMENT_VARIABLES } = options;

const commands = {
  deploy: {
    options: allArguments,
    description: 'Deploys an environment'
  },
  destroy: {
    options: [
      ...baseArguments,
      argumentsMap[REQUIRES_APPROVAL],
      argumentsMap[REVISION],
      argumentsMap[ENVIRONMENT_VARIABLES],
      argumentsMap[SENSITIVE_ENVIRONMENT_VARIABLES]
    ],
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
    description: 'Configures env0 CLI options'
  },
  version: {
    description: 'Shows the CLI version'
  },
  help: {
    description: 'Shows this help message'
  }
};

module.exports = { commands };
