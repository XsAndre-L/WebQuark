export const names = ['@webquark/core', '@webquark/browser', '@webquark/tooling', '@webquark/angular', '@webquark/react'] as const;

export type PackageName = typeof names[number];

export const packageDirectories: Record<PackageName, string> = {
  '@webquark/core': 'packages/core',
  '@webquark/browser': 'packages/browser/components',
  '@webquark/tooling': 'packages/tooling',
  '@webquark/angular': 'packages/browser/angular',
  '@webquark/react': 'packages/browser/react',
};

export const localDependencies: Record<PackageName, readonly PackageName[]> = {
  '@webquark/core': ['@webquark/browser', '@webquark/tooling'],
  '@webquark/browser': [],
  '@webquark/tooling': [],
  '@webquark/angular': ['@webquark/browser'],
  '@webquark/react': ['@webquark/browser'],
};
