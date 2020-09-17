const inquirer = require('inquirer');
const configManager = require('../lib/config-manager');
const { argumentsMap } = require('../config/arguments');
const logger = require('../lib/logger');
const _ = require('lodash');

const emptyConfig = configManager.INCLUDED_OPTIONS.reduce((acc, key) => {
  acc[key] = '';
  return acc;
}, {});

const getQuestions = configuration => {
  return Object.entries(configuration).map(([key, value]) => ({
    name: key,
    message: argumentsMap[key].prompt,
    default: value,
    prefix: ''
  }));
};

const removeEmptyOptions = options => _.pickBy(options, i => i);

const isInteractiveConfigure = options => _.isEmpty(options);

const configure = async options => {
  let newConfiguration;
  if (isInteractiveConfigure(options)) {
    const configuration = { ...emptyConfig, ...configManager.read() };

    const questions = getQuestions(configuration);

    newConfiguration = await inquirer.prompt(questions);
  } else {
    newConfiguration = { ...emptyConfig, ...configManager.read(options) };

    Object.keys(options).forEach(opt => logger.info(`Setting ${opt}: ${options[opt]}`));
  }

  configManager.write(removeEmptyOptions(newConfiguration));
  logger.info('Done configuring CLI options!');
};

module.exports = configure;
