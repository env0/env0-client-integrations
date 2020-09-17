const { argumentsMap, allArguments, baseArguments } = require('./arguments');
const { options } = require('./constants');

const { API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID, ENVIRONMENT_NAME, BLUEPRINT_ID, REQUIRES_APPROVAL } = options;

const commands = {
  deploy: {
    options: allArguments,
    help: [
      {
        desc: 'Deploys an environment',
        example: `$ env0 deploy -k <${API_KEY}> -s <${API_SECRET}> -o <${ORGANIZATION_ID}> -p <${PROJECT_ID}> -b <${BLUEPRINT_ID}> -e <${ENVIRONMENT_NAME}> -r [revision] -v [stage=dev]`
      }
    ]
  },
  destroy: {
    options: [...baseArguments, argumentsMap[REQUIRES_APPROVAL]],
    help: [
      {
        desc: 'Destroys an environment',
        example: `$ env0 destroy -k <${API_KEY}> -s <${API_SECRET}> -o <${ORGANIZATION_ID}> -p <${PROJECT_ID}> -e <${ENVIRONMENT_NAME}>\n`
      }
    ]
  },
  approve: {
    options: baseArguments,
    help: [
      {
        desc: 'Accepts a deployment that is pending approval',
        example: `$ env0 approve -k <${API_KEY}> -s <${API_SECRET}> -o <${ORGANIZATION_ID}> -p <${PROJECT_ID}> -e <${ENVIRONMENT_NAME}>\n`
      }
    ]
  },
  cancel: {
    options: baseArguments,
    help: [
      {
        desc: 'Cancels a deployment that is pending approval',
        example: `$ env0 cancel -k <${API_KEY}> -s <${API_SECRET}> -o <${ORGANIZATION_ID}> -p <${PROJECT_ID}> -e <${ENVIRONMENT_NAME}>\n`
      }
    ]
  },
  configure: {
    options: [...baseArguments, argumentsMap[BLUEPRINT_ID]],
    internal: true,
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
    internal: true,
    ignoreFlags: true,
    help: [
      {
        desc: 'Shows the CLI version',
        example: `$ env0 version`
      }
    ]
  },
  help: {
    internal: true,
    ignoreFlags: true,
    help: [
      {
        desc: 'Shows this help message',
        example: `$ env0 help`
      }
    ]
  }
};

module.exports = { commands };
