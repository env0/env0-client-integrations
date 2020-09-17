const help = require('./help');
const configure = require('./configure');
const pkg = require('../../package.json');
const logger = require('../lib/logger');

const showVersion = () => {
  logger.info(pkg.version);
};

const runInternalCommand = async (command, options) => {
  const commands = {
    help: () => help(),
    version: () => showVersion(),
    configure: async () => configure(options)
  };

  await commands[command]();
};

module.exports = runInternalCommand;
