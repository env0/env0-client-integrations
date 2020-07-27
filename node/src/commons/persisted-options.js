const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const { OPTIONS } = require("./constants");

const { API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID, BLUEPRINT_ID, ENVIRONMENT_NAME } = OPTIONS;
const CONFIG_FILE = path.join(os.homedir(), '.env0', 'config.json');

const envVarToOptionMapper = {
    ENV0_API_KEY: API_KEY,
    ENV0_API_SECRET: API_SECRET,
    ENV0_ORGANIZATION_ID: ORGANIZATION_ID,
    ENV0_PROJECT_ID: PROJECT_ID,
    ENV0_BLUEPRINT_ID: BLUEPRINT_ID,
    ENV0_ENVIRONMENT_NAME: ENVIRONMENT_NAME
}

const reduceOptions = (config) => {
    const includedOptions = [ API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID, BLUEPRINT_ID, ENVIRONMENT_NAME ];

    console.log('DEBUG: Reducing unwanted options...');
    const reducedOptions = {};
    Object.entries(config).forEach(([option, value]) => {
        if (includedOptions.includes(option)) {
            reducedOptions[option] = value;
        }
    })

    return reducedOptions;
}


const getEnvVars = () => {
    const config = {};

    console.log('DEBUG: Checking environment variables...');
    Object.entries(envVarToOptionMapper).forEach(([envVar, option]) => {
        if (process.env[envVar]) {
            console.log(`DEBUG: Found environment variable ${envVar}`);
            config[option] = process.env[envVar];
        }
    });

    return config;
}

const read = () => {
    let config = {};

    console.log('DEBUG: Checking if configuration exists...')
    if (fs.existsSync(CONFIG_FILE)) {
        console.log('DEBUG: Reading from existing configuration...');
        const raw = fs.readFileSync(CONFIG_FILE);

        try {
            config = JSON.parse(raw);
        } catch (err) {
            throw new Error(`Malformed config file found at: ${CONFIG_FILE}`);
        }
    }

    return {
        ...config,
        ...getEnvVars()
    };
};

const write = (options) => {
    const reduced = reduceOptions(options);

    console.log('DEBUG: Writing configuration to disk...');
    fs.writeJsonSync(CONFIG_FILE, reduced, { spaces: 2 });
}

module.exports = {
    read,
    write
}