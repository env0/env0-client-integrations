const { options } = require('./constants');

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
  REQUIRES_APPROVAL,
  TARGETS
} = options;

const argumentsMap = {
  [API_KEY]: {
    name: API_KEY,
    alias: 'k',
    type: String,
    description: 'env0 API Key',
    prompt: 'env0 API Key',
    secret: true,
    group: ['deploy', 'destroy', 'approve', 'cancel']
  },
  [API_SECRET]: {
    name: API_SECRET,
    alias: 's',
    type: String,
    description: 'env0 API Secret',
    prompt: 'env0 API Secret',
    secret: true,
    group: ['deploy', 'destroy', 'approve', 'cancel']
  },
  [ORGANIZATION_ID]: {
    name: ORGANIZATION_ID,
    alias: 'o',
    type: String,
    description: 'env0 Organization ID',
    prompt: 'Organization ID',
    group: ['deploy', 'destroy', 'approve', 'cancel']
  },
  [PROJECT_ID]: { name: PROJECT_ID, alias: 'p', type: String, description: 'env0 Project ID', prompt: 'Project ID' },
  [ENVIRONMENT_NAME]: {
    name: ENVIRONMENT_NAME,
    alias: 'e',
    type: String,
    description: 'The environment name you want to perform the action on',
    prompt: 'Environment Name',
    group: ['deploy', 'destroy', 'approve', 'cancel']
  },
  [BLUEPRINT_ID]: {
    name: BLUEPRINT_ID,
    alias: 'b',
    type: String,
    description: 'The Blueprint id you would like to deploy',
    prompt: 'Blueprint ID',
    group: ['deploy']
  },
  [REQUIRES_APPROVAL]: {
    name: REQUIRES_APPROVAL,
    alias: 'a',
    type: String,
    group: ['deploy', 'destroy'],
    description:
      'Whether deploy/destroy should wait for approval on plan stage before deploy/destroy your environment. Can be either "true" or "false"'
  },
  [ENVIRONMENT_VARIABLES]: {
    name: ENVIRONMENT_VARIABLES,
    alias: 'v',
    type: String,
    multiple: true,
    defaultValue: [],
    group: ['deploy'],
    description:
      'The environment variables to set on the deployed environment - works only on deploy and can be multiple, the format is "environmentVariableName1=value"'
  },
  [SENSITIVE_ENVIRONMENT_VARIABLES]: {
    name: SENSITIVE_ENVIRONMENT_VARIABLES,
    alias: 'q',
    type: String,
    multiple: true,
    defaultValue: [],
    group: ['deploy'],
    description:
      'The sensitive environment variables to set on the deployed environment - works only on deploy and can be multiple, the format is "environmentVariableName1=value"'
  },
  [REVISION]: {
    name: REVISION,
    alias: 'r',
    type: String,
    group: ['deploy'],
    description: 'Your git revision, can be a branch tag or a commit hash. Default value "master" '
  },
  [TARGETS]: {
    name: TARGETS,
    alias: 't',
    type: String,
    group: ['deploy'],
    description:
      'A list of resources to explicitly include in the deployment, delimited by comma. Format is "resource1,resource2,resource3"'
  }
};

module.exports = {
  argumentsMap,
  allArguments: Object.values(argumentsMap),
  baseArguments: [
    argumentsMap[API_KEY],
    argumentsMap[API_SECRET],
    argumentsMap[ORGANIZATION_ID],
    argumentsMap[PROJECT_ID],
    argumentsMap[ENVIRONMENT_NAME]
  ]
};
