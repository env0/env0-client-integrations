const convertStringToBoolean = str => {
  if (str === 'true') return true;
  if (str === 'false') return false;
};

const removeEmptyValuesFromObj = payload => JSON.parse(JSON.stringify(payload));

module.exports = {
  convertStringToBoolean,
  removeEmptyValuesFromObj
};
