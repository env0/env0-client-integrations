const pRetry = require('p-retry');

const convertStringToBoolean = str => {
  if (str === 'true') return true;
  if (str === 'false') return false;
};

const removeEmptyValuesFromObj = payload => JSON.parse(JSON.stringify(payload));

const withRetry = (promiseFn) => pRetry(promiseFn, { retries: 2 });

module.exports = {
  convertStringToBoolean,
  removeEmptyValuesFromObj,
  withRetry
};
