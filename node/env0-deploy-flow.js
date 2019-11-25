const DeployUtils = require('./env0-deploy-utils');

const deployUtils = new DeployUtils();

const runDeployment = async (options) => {
    await DeployUtils.init(options);
    if (options.action === 'Deploy') {
        await createAndDeploy(options);
    }
    else if (options.action === 'Destroy') {
        await destroy(options);
    }
    else {
        throw new Error(`Action ${options.action} is Invalid, Valid actions are Deploy and Destroy`);
    }
};

const createAndDeploy = async (options) => {
    console.log('Starting deployment');
    let environment = await deployUtils.getEnvironment(options.environmentName, options.organizationId);
    console.log(`got the following environment: ${JSON.stringify(environment)}`);

    if (!environment) {
        console.log('did not find an environment');
        environment = await deployUtils.createEnvironment(options.environmentName, options.organizationId, options.projectId);
    }
    await setConfigurationFromOptions(options, environment);
    await deployUtils.pollEnvironmentStatus(environment.id);
    await deployUtils.deployEnvironment(environment, options.revision, options.blueprintId);
    await deployUtils.pollEnvironmentStatus(environment.id);
};

const destroy = async (options) => {
    console.log('Starting destroying an environment');
    const environment = await deployUtils.getEnvironment(options.environmentName, options.organizationId);
    console.log(`got the following environment: ${JSON.stringify(environment)}`);

    if (environment) {
        await deployUtils.pollEnvironmentStatus(environment.id);
        await deployUtils.destroyEnvironment(environment);
        await deployUtils.pollEnvironmentStatus(environment.id);
    } else {
        console.log(`No environment found with the name`)
    }
};

const setConfigurationFromOptions = async (options, environment) => {
    const configurations = options.configurations;
    if (configurations && configurations.length > 0) {
        await configurations.forEach(async(config) => {
            const configArray = config.split(/=(.+)/);
            if (configArray.length === 3) {
                const name = configArray[0];
                const value = configArray[1];
                console.log(`Setting configuration ${name} to be ${value} in environmentId: ${environment.id}`);
                await deployUtils.setConfiguration(environment, options.blueprintId, name, value);
            }
        })
    }
};

module.exports = runDeployment;
