import pRetry from 'p-retry';

export const convertStringToBoolean = str => {
  if (str === 'true') return true;
  if (str === 'false') return false;
};

export const removeEmptyValuesFromObj = payload => JSON.parse(JSON.stringify(payload));

export const withRetry = (promiseFn) => pRetry(promiseFn, { retries: 2 });
