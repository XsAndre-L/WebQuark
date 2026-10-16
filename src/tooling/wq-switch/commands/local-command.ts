import { build } from './build-command';

/** Builds WebQuark packages and connects the consuming application to local snapshot generations. */
export async function local(root: string): Promise<void> {
  await build(root, true);
}
