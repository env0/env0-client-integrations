const pkg = require('../../package.json');

async function updateNotifier() {
  const updateNotifier = (await import('update-notifier')).default;
  updateNotifier({ pkg }).notify();
}

module.exports = updateNotifier;
