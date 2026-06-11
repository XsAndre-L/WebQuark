import { Config } from '@stencil/core';
import { reactOutputTarget } from '@stencil/react-output-target';
import { angularOutputTarget } from '@stencil/angular-output-target';

export const config: Config = {
  namespace: 'webquark',
  globalStyle: 'src/global/global.css',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'www',
      serviceWorker: null, // disable service workers
    },
    reactOutputTarget({
      componentCorePackage: '@webquark/core',
      outDir: 'packages/react/src/stencil-generated/',
    }),
    angularOutputTarget({
      componentCorePackage: '@webquark/core',
      directivesProxyFile: 'packages/angular/src/stencil-generated/components.ts',
      directivesArrayFile: 'packages/angular/src/stencil-generated/index.ts',
      outputType: 'standalone',
    }),
  ],
};
