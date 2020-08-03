const convertRequiresApprovalToBoolean = str => {
  if (str === 'true') return true;
  if (str === 'false') return false;
};

module.exports = {
  convertRequiresApprovalToBoolean
};
