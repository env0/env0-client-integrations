# Nodejs client

At [env0](https://env0.com) we believe in eating your own dog food so we are using env0 to deploy env0.

![eat your own dog food]( https://assets.hwvp.com/uploads/articles/eat-your-own-dogfood-saas-vendors-aka-drink-your-own-champagne/_blogFeaturedImage/dogfood.jpg)

This is a Nodejs client that we are using to deploy env0 on each PR.

## Install

``$ npm install``

``$ yarn install``


## env0 cli example

  `$ node env0-deploy-cli.js -a Deploy -e dev -k apiKey -s apiSecret -b blueprintId -o organizationId -p projectId -r master`
  
  `$ node env0-deploy-cli.js --help`

### Options

  **-k --apiKey** - Your env0 API Key

  **-s --apiSecret** - Your env0 API Secret

  **-a --action** - The action you would like to perform - can be Deploy/Destroy

  **-o --organizationId** - Your env0 Organization id

  **-p --projectId** - Your env0 Project id

  **-b --blueprintId** - The Blueprint id you would like to deploy with

  **-e --environmentName** - The environment name you would like to create, if it exists it will deploy to that environment

  **-r --revision** - You git revision, can be a branch tag or a commit hash. Default value `master`

  **-h --help** - Get help
