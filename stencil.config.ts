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
      indexHtml: 'playground/index.html',
      copy: [
        { src: 'playground/index.html', dest: 'index.html' },
        { src: 'playground/playground.css', dest: 'playground.css' },
        { src: 'playground/playground.js', dest: 'playground.js' },
        { src: 'playground/state.js', dest: 'state.js' },
        { src: 'playground/components', dest: 'components' },
        { src: 'playground/specs', dest: 'playground/specs' },
        { src: 'playground/css', dest: 'css' },
        { src: 'playground/views', dest: 'views' }
      ]
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
      valueAccessorConfigs: [
        {
          elementSelectors: ['q-input', 'q-textarea'],
          event: 'qChange',
          targetAttr: 'value',
          type: 'text',
        },
        {
          elementSelectors: ['q-dropdown'],
          event: 'qChange',
          targetAttr: 'value',
          type: 'select',
        },
      ],
    }),
  ],
};
