import { Config } from '@stencil/core';
import { reactOutputTarget } from '@stencil/react-output-target';
import { angularOutputTarget } from '@stencil/angular-output-target';

export const config: Config = {
  namespace: 'webquark',
  globalStyle: 'src/theme/theme.css',
  minifyCss: true,
  minifyJs: true,
  sourceMap: false,
  watchIgnoredRegex: [/src\/playground\/.*/],
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: 'loader',
      empty: true,
      copy: [{ src: 'theme/behaviors/native-content.css', dest: 'native-content.css' }],
    },
    {
      type: 'dist-custom-elements',
      dir: 'dist/components',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
      empty: true,
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'www',
      dir: 'dist/playground',
      serviceWorker: null, // disable service workers
      indexHtml: 'playground/index.html',
      copy: [
        { src: 'playground/index.html', dest: 'index.html' },
        { src: 'playground/presets.html', dest: 'presets.html' },
        { src: 'theme/behaviors/native-content.css', dest: 'native-content.css' },
        { src: 'playground/logo.svg', dest: 'logo.svg' },
        { src: 'playground/playground.css', dest: 'playground.css' },
        { src: 'playground/playground.bundled.js', dest: 'playground.js' },
        { src: 'playground/components.manifest.json', dest: 'playground/components.manifest.json' },
        { src: 'playground/specs', dest: 'playground/specs' },
        { src: 'playground/css', dest: 'css' },
        { src: 'playground/assets', dest: 'assets' },
        { src: 'playground/views', dest: 'views' },
        { src: 'assets/icons', dest: 'assets/icons' }
      ]
    },
    reactOutputTarget({
      componentCorePackage: '@webquark/core',
      outDir: 'packages/react/src/stencil-generated/',
      excludeComponents: ['q-data-table'],
    }),
    angularOutputTarget({
      componentCorePackage: '@webquark/core',
      directivesProxyFile: 'packages/angular/src/stencil-generated/components.ts',
      directivesArrayFile: 'packages/angular/src/stencil-generated/index.ts',
      outputType: 'standalone',
      inlineProperties: true,
      valueAccessorConfigs: [
        {
          elementSelectors: ['q-input', 'q-textarea'],
          event: 'qInput',
          targetAttr: 'value',
          type: 'text',
        },
        {
          elementSelectors: ['q-dropdown', 'q-radio-group'],
          event: 'qChange',
          targetAttr: 'value',
          type: 'select',
        },
        {
          elementSelectors: ['q-toggle'],
          event: 'qChange',
          targetAttr: 'checked',
          type: 'boolean',
        },
      ],
    }),
  ],
};
