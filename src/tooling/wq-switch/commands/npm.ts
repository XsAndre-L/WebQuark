import { restore } from '../state';
export function npm(root: string): void {
  restore(root);
  console.log('NPM: original package connections restored. No versions or lockfiles changed.\nRestart the consumer dev server.');
}
