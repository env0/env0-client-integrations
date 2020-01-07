#### 🚧 ⚠️ WIP, the API may change 

# Nodejs client

At [env0](https://env0.com) we believe in eating your own dog food so we are using env0 to deploy env0.

![eat your own dog food]( https://assets.hwvp.com/uploads/articles/eat-your-own-dogfood-saas-vendors-aka-drink-your-own-champagne/_blogFeaturedImage/dogfood.jpg)

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

``$ yarn install``


## env0 cli example

  `$ node env0-deploy-cli.js -k <apiKey> -s <apiSecret> -a <Deploy> -o <organizationId> -p <projectId> -b <blueprintId> -e <environmentName> -r [master] -v [stage=dev]`
  
  `$ node env0-deploy-cli.js --help`

### Options

  **-k --apiKey** - Your env0 API Key

  **-s --apiSecret** - Your env0 API Secret

  **-a --action** - The action you would like to perform - can be deploy/destroy

  **-o --organizationId** - Your env0 Organization id

  **-p --projectId** - Your env0 Project id

  **-b --blueprintId** - The Blueprint id you would like to deploy with

  **-e --environmentName** - The environment name you would like to create, if it exists it will deploy to that environment

  **-v --environmentVariables** - The environment variables to set on the deployed environment - works only on deploy and can be multiple, the format is "environmentVariableName1=value" 
  
  **-r --revision** - You git revision, can be a branch tag or a commit hash. Default value `master`

  **--archiveAfterDestroy** - Archive the environment after a successful destroy

  **-h --help** - Get help
