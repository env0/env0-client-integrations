const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const { OPTIONS } = require('./constants');
const { pick } = require('lodash');

const CONFIG_FILE = path.join(os.homedir(), '.env0', 'config.json');

const { API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID, BLUEPRINT_ID, ENVIRONMENT_NAME } = OPTIONS;

const INCLUDED_OPTIONS = [ API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID, BLUEPRINT_ID, ENVIRONMENT_NAME ];

const envVarToOptionMapper = {
    ENV0_API_KEY: API_KEY,
    ENV0_API_SECRET: API_SECRET,
    ENV0_ORGANIZATION_ID: ORGANIZATION_ID,
    ENV0_PROJECT_ID: PROJECT_ID,
    ENV0_BLUEPRINT_ID: BLUEPRINT_ID,
    ENV0_ENVIRONMENT_NAME: ENVIRONMENT_NAME
}

const getEnvVars = () => {
    const config = {};

    Object.entries(envVarToOptionMapper).forEach(([envVar, option]) => {
        if (process.env[envVar]) {
            console.log(`Found environment variable ${envVar}`);
            config[option] = process.env[envVar];
        }
    });

    return config;
}

const read = () => {
    let config = {};

    if (fs.existsSync(CONFIG_FILE)) {
        console.log('Reading from existing configuration...');
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
    const reduced = pick(options, INCLUDED_OPTIONS);

    console.log('Writing configuration to disk...');
    fs.writeJsonSync(CONFIG_FILE, reduced, { spaces: 2 });
}

module.exports = {
    read,
    write
}