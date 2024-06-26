const { options } = require('./constants');

const {
  API_KEY,
  API_SECRET,
  ORGANIZATION_ID,
  PROJECT_ID,
  BLUEPRINT_ID,
  WORKSPACE_NAME,
  ENVIRONMENT_NAME,
  ENVIRONMENT_ID,
  ENVIRONMENT_VARIABLES,
  TERRAFORM_VARIABLES,
  SENSITIVE_ENVIRONMENT_VARIABLES,
  REVISION,
  SKIP_STATE_REFRESH,
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
    group: ['deploy', 'destroy', 'approve', 'cancel', 'configure']
  },
  [API_SECRET]: {
    name: API_SECRET,
    alias: 's',
    type: String,
    description: 'env0 API Secret',
    prompt: 'env0 API Secret',
    secret: true,
    group: ['deploy', 'destroy', 'approve', 'cancel', 'configure']
  },
  [ORGANIZATION_ID]: {
    name: ORGANIZATION_ID,
    alias: 'o',
    type: String,
    description: 'env0 Organization ID',
    prompt: 'Organization ID',
    group: ['deploy', 'destroy', 'approve', 'cancel', 'configure']
  },
  [PROJECT_ID]: {
    name: PROJECT_ID,
    alias: 'p',
    type: String,
    description: 'env0 Project ID',
    prompt: 'Project ID',
    group: ['deploy', 'destroy', 'approve', 'cancel', 'configure']
  },
  [WORKSPACE_NAME]: {
    name: WORKSPACE_NAME,
    alias: 'w',
    type: String,
    description: 'Terraform Workspace name - cannot be changed after the first deployment',
    group: ['deploy']
  },
  [ENVIRONMENT_NAME]: {
    name: ENVIRONMENT_NAME,
    alias: 'e',
    type: String,
    description: 'The environment name you want to perform the action on',
    prompt: 'Environment Name',
    group: ['deploy', 'destroy', 'approve', 'cancel', 'configure']
  },
  [ENVIRONMENT_ID]: {
    name: ENVIRONMENT_ID,
    type: String,
    description: 'The environment id you want to perform the action on',
    prompt: 'Environment ID',
    group: ['deploy', 'destroy', 'approve', 'cancel', 'configure']
  },
  [BLUEPRINT_ID]: {
    name: BLUEPRINT_ID,
    alias: 'b',
    type: String,
    description: 'The Blueprint id you would like to deploy',
    prompt: 'Blueprint ID',
    group: ['deploy', 'configure']
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
  [TERRAFORM_VARIABLES]: {
    name: TERRAFORM_VARIABLES,
    alias: 'u',
    type: String,
    multiple: true,
    defaultValue: [],
    group: ['deploy'],
    description:
      'The terraform variables to set on the deployed environment - works only on deploy and can be multiple, the format is "terraformVariableName=value"'
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
  [SKIP_STATE_REFRESH]: {
    name: SKIP_STATE_REFRESH,
    alias: 'z',
    type: String,
    group: ['destroy'],
    description: 'Disable automatic state refresh on plan destroy phase'
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
