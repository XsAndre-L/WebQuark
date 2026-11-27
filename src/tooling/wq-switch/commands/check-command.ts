import { createRequire } from 'node:module';
import { statSync } from 'node:fs';
import { join } from 'node:path';
import { inspectStatus } from './status-command';
import { reportFailure, reportSuccess } from '../cli/feedback';
import { hasJournal, readState } from '../domains/transactions';
import { manifest, selectedPackages } from '../domains/workspace';
import { installed, validatePackage } from '../domains/snapshots';

/** Verifies that required native-content.css or tooling exports exist and can be resolved by consumer bundlers. */
export function check(root: string): void {
  const selected = selectedPackages(root);

  if (!selected.includes('@webquark/browser')) {
    validatePackage(installed('@webquark/tooling', root));
    finishCheck(root);
    return;
  }

  const pkg = manifest(root);
  const directBrowser = pkg.dependencies?.['@webquark/browser'] ?? pkg.devDependencies?.['@webquark/browser'];
  const stylesheet = !directBrowser && selected.includes('@webquark/core') ? '@webquark/core/browser/native-content.css' : '@webquark/browser/native-content.css';

  try {
    const wrapper = selected.find(name => name === '@webquark/angular' || name === '@webquark/react');
    const from = !directBrowser && !selected.includes('@webquark/core') && wrapper ? installed(wrapper, root) : root;
    const file = createRequire(join(from, 'package.json')).resolve(stylesheet);
    if (!statSync(file).isFile())
      throw new Error('The stylesheet is not a file.');
  } catch (error) {
    throw new Error(
      'Could not resolve "' +
        stylesheet +
        '". The installed browser package or core browser forwarding entry must export this stylesheet and include its built CSS file.\n' +
        'For local development, run bun run wq-setup --source "<path-to-WebQuark>", then bun run wq-switch local.\n' +
        'wq-setup configures the checkout; wq-switch local builds and activates it. Alternatively, install matching published WebQuark packages containing this export.',
      { cause: error },
    );
  }

  finishCheck(root);
}

function finishCheck(root: string): void {
  if (readState(root) || hasJournal(root)) {
    const result = inspectStatus(root);

    if (result.errors.length > 0) {
      reportFailure(result.errors[0], root, 'WebQuark check failed');
      return;
    }
  }

  reportSuccess();
}
