const convertStringToBoolean = str => {
  if (str === 'true') return true;
  if (str === 'false') return false;
};

const removeEmptyValuesFromObj = payload =>
  JSON.parse(
    JSON.stringify(payload, (_, value) => {
      if (value === undefined) return undefined;
      return value;
    })
  );

module.exports = {
  convertStringToBoolean,
  removeEmptyValuesFromObj
};
