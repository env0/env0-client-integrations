const { createLogger, format, transports } = require('winston');
const _ = require('lodash');
const { argumentsMap } = require('../config/arguments');

const secrets = [];

const getSecureSecret = secret => {
  const charsToKeep = 5;
  const pattern = new RegExp(`^.{1,${secret.length - charsToKeep}}`);
  return secret.replace(pattern, sub => '*'.repeat(sub.length));
};

const setSecrets = options => {
  const secretOptions = _(argumentsMap)
    .pickBy(({ secret }) => secret)
    .keys()
    .value();

  const secretValues = secretOptions.map(opt => options[opt]);

  secrets.push(...secretValues);
};

const masker = format(info => {
  let message = info.message;

  secrets.forEach(secret => {
    if (message.includes(secret)) {
      const secureSecret = getSecureSecret(secret);
      message = _.replace(message, secret, secureSecret);
    }
  });

  info.message = message;
  return info;
});

const logger = createLogger({
  format: format.combine(
    masker(),
    format.printf(info => info.message)
  ),
  transports: [new transports.Console({ showLevel: false })]
});

logger.setSecrets = setSecrets;

module.exports = logger;
