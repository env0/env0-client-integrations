![CI](https://github.com/env0/env0-client-integrations/workflows/CI/badge.svg?branch=master)

#### 🚧 ⚠️ WIP, the API may change

# Nodejs client

At [env0](https://env0.com) we believe in eating your own dog food so we are using env0 to deploy env0.

![eat your own dog food](https://assets.hwvp.com/uploads/articles/eat-your-own-dogfood-saas-vendors-aka-drink-your-own-champagne/_blogFeaturedImage/dogfood.jpg)

This is a Nodejs client that we are using to deploy env0 on each PR.

## API Referece

https://docs.env0.com/reference

## Install

```
$ git clone https://github.com/env0/env0-client-integrations.git
$ cd env0-client-integrations
$ npm install
```

For yarn please run:

`$ yarn install`

## env0 cli example

`$ env0 deploy -k <apiKey> -s <apiSecret> -a <Deploy> -o <organizationId> -p <projectId> -b <blueprintId> -e <environmentName> -r [master] -v [stage=dev]`

`$ env0 --help`

### Options

**-k --apiKey** - Your env0 API Key

**-s --apiSecret** - Your env0 API Secret

**-o --organizationId** - Your env0 Organization id

**-p --projectId** - Your env0 Project id

**-b --blueprintId** - The Blueprint id you would like to deploy with (Optional for existing environments)

**-e --environmentName** - The environment name you would like to create, if it exists it will deploy to that environment (Required for existing environments)
  
 **-v --environmentVariables** - The environment variables to set on the deployed environment - works only on deploy and can be multiple, the format is "environmentVariableName1=value"

**-q --sensitiveEnvironmentVariables** - Same as environment variables (`-v`) but will be marked as sensitive and hidden on env0 platform.

**-r --revision** - You git revision, can be a branch tag or a commit hash. Default value `master`

**--archiveAfterDestroy** - Archive the environment after a successful destroy

**-h --help** - Get help

### Environment Variables

- `ENV0_API_KEY`
- `ENV0_API_SECRET`
- `ENV0_ORGANIZATION_ID`
- `ENV0_PROJECT_ID`
- `ENV0_BLUEPRINT_ID`
- `ENV0_ENVIRONMENT_NAME`

### Configuration File

After initial deployment, a configuration file would be created under `~/.env0/config.json`<br/>
This file will save your last action's required parameters and will spare you from re-configuring the required parameters on every action.

### Order of precedence

1. `env0` CLI explicit parameters
2. Environment Variables
3. Configuration File
