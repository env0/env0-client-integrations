import { input } from '@inquirer/prompts';
import * as configManager from '../lib/config-manager.js';
import { argumentsMap } from '../config/arguments.js';
import logger from '../lib/logger.js';
import _ from 'lodash';

const emptyConfig = configManager.INCLUDED_OPTIONS.reduce((acc, key) => {
  acc[key] = '';
  return acc;
}, {});

const getQuestions = configuration => {
  return Object.entries(configuration).map(([key, value]) => ({
    name: key,
    message: argumentsMap[key].prompt,
    default: value
  }));
};

const removeEmptyAnswers = answers => _.pickBy(answers, i => i);

const isInteractiveConfigure = options => _.isEmpty(options);

const configure = async options => {
  let newConfiguration;
  if (isInteractiveConfigure(options)) {
    const configuration = { ...emptyConfig, ...configManager.read() };
    const questions = getQuestions(configuration);

    const answers = {};
    for (const question of questions) {
      answers[question.name] = await input({
        message: question.message,
        default: question.default,
        theme: { prefix: '' }
      });
    }

    newConfiguration = removeEmptyAnswers(answers);
  } else {
    newConfiguration = configManager.read(options);

    Object.keys(options).forEach(opt => logger.info(`Setting ${opt}: ${options[opt]}`));
  }

  configManager.write(newConfiguration);
  logger.info('Done configuring CLI options!');
};

export default configure;
