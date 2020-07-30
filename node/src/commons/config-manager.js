const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const { OPTIONS } = require('./constants');
const { pick } = require('lodash');

const CONFIG_FILE = path.join(os.homedir(), '.env0', 'config.json');

const { API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID, BLUEPRINT_ID, ENVIRONMENT_NAME } = OPTIONS;

const INCLUDED_OPTIONS = [API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID, BLUEPRINT_ID, ENVIRONMENT_NAME];

const envVarToOptionMapper = {
  ENV0_API_KEY: API_KEY,
  ENV0_API_SECRET: API_SECRET,
  ENV0_ORGANIZATION_ID: ORGANIZATION_ID,
  ENV0_PROJECT_ID: PROJECT_ID,
  ENV0_BLUEPRINT_ID: BLUEPRINT_ID,
  ENV0_ENVIRONMENT_NAME: ENVIRONMENT_NAME
};

const getEnvVars = () => {
  const config = {};

  Object.entries(envVarToOptionMapper).forEach(([envVar, option]) => {
    if (process.env[envVar]) {
      config[option] = process.env[envVar];
    }
  });

  const found = Object.keys(config);
  if (found.length) console.log(`Found environment variables ${found}`);

  return config;
};

const read = configFromParams => {
  let configFromDisk = {};
  const configFromEnv = getEnvVars();

  if (fs.existsSync(CONFIG_FILE)) {
    console.log('Found existing configuration');
    const raw = fs.readFileSync(CONFIG_FILE);

    try {
      configFromDisk = JSON.parse(raw);
    } catch (err) {
      throw new Error(`Malformed config file found at: ${CONFIG_FILE}`);
    }
  }

  return {
    ...configFromDisk,
    ...configFromEnv,
    ...configFromParams
  };
};

const write = options => {
  const reduced = pick(options, INCLUDED_OPTIONS);
  fs.outputJsonSync(CONFIG_FILE, reduced, { spaces: 2 });
};

module.exports = {
  read,
  write
};
