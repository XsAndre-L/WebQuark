import { createRequire } from 'node:module';
import { statSync } from 'node:fs';
import { join } from 'node:path';
import { status } from './status';
import { hasJournal, readState } from '../state';

/** Resolve from the consumer so this also checks the installed package's exports map. */
export function check(root: string): void {
  const stylesheet = '@webquark/core/native-content.css';
  try {
    const file = createRequire(join(root, 'package.json')).resolve(stylesheet);
    if (!statSync(file).isFile()) throw new Error('The stylesheet is not a file.');
  } catch (error) {
    throw new Error(
      'Could not resolve "' + stylesheet + '". The installed @webquark/core must export "./native-content.css" and include its built CSS file.\n' +
      'For local development, run bun run wq-setup --source "<path-to-WebQuark>", then bun run wq-switch local.\n' +
      'wq-setup configures the checkout; wq-switch local builds and activates it. Alternatively, install matching published WebQuark packages containing this export.',
      { cause: error },
    );
  }
  console.log('WebQuark native-content.css export and file are available.');
  // Reuse the status command's local-state checks; published installs need no setup.
  if (readState(root) || hasJournal(root)) status(root);
}
