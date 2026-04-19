import updateNotifier from 'update-notifier';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('../../package.json');

export default function notifyUpdates() {
  updateNotifier({ pkg }).notify();
}
