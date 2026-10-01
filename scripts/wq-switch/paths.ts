import { join } from 'node:path';

/** All persistent consumer files live here; source/build locks remain shared in the OS temp directory. */
export function projectPaths(root: string) {
  const directory = join(root, '.webquark');
  const stateDirectory = join(directory, 'state');
  return {
    directory,
    config: join(directory, '.webquark.json'),
    packages: join(directory, 'generated', 'packages'),
    state: join(stateDirectory, 'state.json'),
    journal: join(stateDirectory, 'journal.json'),
  };
}

export type ProjectPaths = ReturnType<typeof projectPaths>;
