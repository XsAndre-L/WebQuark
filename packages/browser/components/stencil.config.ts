import { Config } from '@stencil/core';
import { reactOutputTarget } from '@stencil/react-output-target';
import { angularOutputTarget } from '@stencil/angular-output-target';
import { resolve } from 'node:path';

const repositoryRoot = resolve(__dirname, '../../..');
const fromRepository = (path: string) => resolve(repositoryRoot, path);

export const config: Config = {
  namespace: 'webquark',
  srcDir: fromRepository('src/browser'),
  srcIndexHtml: fromRepository('src/playground/index.html'),
  tsconfig: 'tsconfig.json',
  cacheDir: fromRepository('.stencil'),
  globalStyle: fromRepository('src/browser/theme/theme.css'),
  minifyCss: true,
  minifyJs: true,
  sourceMap: false,
  watchIgnoredRegex: [/src\/playground\/.*/],
  outputTargets: [
    {
      type: 'dist',
      dir: 'dist',
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
      dir: fromRepository('.stencil/dist/playground'),
      empty: false, // Preserve the live Bun watch bundle; the compiler cache has its own lifecycle.
      serviceWorker: null, // disable service workers
      indexHtml: 'index.html',
      copy: [
        { src: '../playground/presets.html', dest: 'presets.html' },
        { src: '../playground/consumer.html', dest: 'playground/consumer.html' },
        { src: 'theme/behaviors/native-content.css', dest: 'native-content.css' },
        { src: '../playground/logo.svg', dest: 'logo.svg' },
        { src: '../playground/playground.css', dest: 'playground.css' },
        { src: '../playground/components.manifest.json', dest: 'playground/components.manifest.json' },
        { src: '../playground/specs', dest: 'playground/specs' },
        { src: '../playground/css', dest: 'css' },
        { src: '../playground/assets', dest: 'assets' },
        { src: '../playground/views', dest: 'views' },
        { src: 'assets/icons', dest: 'assets/icons' }
      ]
    },
    reactOutputTarget({
      stencilPackageName: '@webquark/browser',
      customElementsDir: 'dist/components',
      outDir: fromRepository('packages/browser/react/src/stencil-generated/'),
      excludeComponents: ['q-data-table'],
    }),
    angularOutputTarget({
      componentCorePackage: '@webquark/browser',
      directivesProxyFile: fromRepository('packages/browser/angular/src/stencil-generated/components.ts'),
      directivesArrayFile: fromRepository('packages/browser/angular/src/stencil-generated/index.ts'),
      outputType: 'standalone',
      inlineProperties: true,
      valueAccessorConfigs: [
        { elementSelectors: ['q-slider'], event: 'qInput', targetAttr: 'value', type: 'number' },
        {
          elementSelectors: ['q-input', 'q-textarea'],
          event: 'qInput',
          targetAttr: 'value',
          type: 'text',
        },
        {
          elementSelectors: ['q-dropdown:not([multiple])', 'q-radio-group'],
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
