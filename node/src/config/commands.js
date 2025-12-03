const { argumentsMap, allArguments, baseArguments, nonCredentialBaseArguments } = require('./arguments');
const { options } = require('./constants');
const deploy = require('../commands/deploy');
const destroy = require('../commands/destroy');
const approve = require('../commands/approve');
const cancel = require('../commands/cancel');
const agentsSettingsListAgents = require('../commands/agents-settings-list-agents');

const { API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID, ENVIRONMENT_NAME, BLUEPRINT_ID, SKIP_STATE_REFRESH, REQUIRES_APPROVAL } = options;

const BASE_REQUIRED_OPTIONS = [API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID, ENVIRONMENT_NAME];
const ORG_REQUIRED_OPTIONS = [API_KEY, API_SECRET, ORGANIZATION_ID];

const commands = {
  deploy: {
    handler: deploy,
    requiredOptions: BASE_REQUIRED_OPTIONS,
    useDeployUtils: true,
    options: allArguments.filter(option => ![API_KEY, API_SECRET].includes(option.name)),
    help: [
      {
        desc: 'Deploys an environment',
        example: `$ env0 deploy -o <${ORGANIZATION_ID}> -p <${PROJECT_ID}> -b <${BLUEPRINT_ID}> -e <${ENVIRONMENT_NAME}> -r [revision] -v [stage=dev] -u [tfvar=tfvalue]`
      }
    ]
  },
  destroy: {
    handler: destroy,
    requiredOptions: BASE_REQUIRED_OPTIONS,
    useDeployUtils: true,
    options: [...nonCredentialBaseArguments, argumentsMap[REQUIRES_APPROVAL], argumentsMap[SKIP_STATE_REFRESH]],
    help: [
      {
        desc: 'Destroys an environment',
        example: `$ env0 destroy -o <${ORGANIZATION_ID}> -p <${PROJECT_ID}> -e <${ENVIRONMENT_NAME}>\n`
      }
    ]
  },
  approve: {
    handler: approve,
    requiredOptions: BASE_REQUIRED_OPTIONS,
    useDeployUtils: true,
    options: nonCredentialBaseArguments,
    help: [
      {
        desc: 'Accepts a deployment that is pending approval',
        example: `$ env0 approve -o <${ORGANIZATION_ID}> -p <${PROJECT_ID}> -e <${ENVIRONMENT_NAME}>\n`
      }
    ]
  },
  cancel: {
    handler: cancel,
    requiredOptions: BASE_REQUIRED_OPTIONS,
    useDeployUtils: true,
    options: baseArguments,
    help: [
      {
        desc: 'Cancels a deployment that is pending approval',
        example: `$ env0 cancel -o <${ORGANIZATION_ID}> -p <${PROJECT_ID}> -e <${ENVIRONMENT_NAME}>\n`
      }
    ]
  },
  'agents-list': {
    handler: agentsSettingsListAgents,
    requiredOptions: ORG_REQUIRED_OPTIONS,
    useDeployUtils: false,
    options: nonCredentialBaseArguments,
    help: [
      {
        desc: 'Lists organization agents',
        example: `$ env0 agents list -o <${ORGANIZATION_ID}>\n`
      }
    ]
  },
  configure: {
    options: [...baseArguments, argumentsMap[BLUEPRINT_ID]],
    help: [
      {
        desc: 'Configures env0 CLI options',
        example: `$ env0 configure -k <${API_KEY}> -s <${API_SECRET}> -o <${ORGANIZATION_ID}> -p <${PROJECT_ID}> -e <${ENVIRONMENT_NAME}> -b <${BLUEPRINT_ID}>`
      },
      {
        desc: 'Interactively configures env0 CLI options\n',
        example: `$ env0 configure`
      }
    ]
  },
  version: {
    help: [
      {
        desc: 'Shows the CLI version',
        example: `$ env0 version`
      }
    ]
  },
  help: {
    help: [
      {
        desc: 'Shows this help message',
        example: `$ env0 help`
      }
    ]
  }
};

module.exports = { commands };
