import { restore } from '../workflows';

/** Restores original installed packages from backups without modifying dependency versions or lockfiles. */
export function npm(root: string): void {
  restore(root);
  console.log('NPM: original package connections restored. No versions or lockfiles changed.\nRestart the consumer dev server.');
}
