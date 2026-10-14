import { fileURLToPath } from 'node:url';
import { formSubmitCommands } from './src/browser/components/inputs/form/test/form-submit-commands.mts';
import { playwright } from '@vitest/browser-playwright';
import { defineVitestConfig } from '@stencil/vitest/config';
import { stencilVitestPlugin } from '@stencil/vitest/plugin';

// Verify workspace wrappers against the browser artifacts built by packages:build.
const browserResolve = {
  alias: [
    {
      find: /^@webquark\/browser$/,
      replacement: fileURLToPath(new URL('./packages/browser/components/dist/index.js', import.meta.url)),
    },
    {
      find: '@webquark/browser/dist/components',
      replacement: fileURLToPath(new URL('./packages/browser/components/dist/components', import.meta.url)),
    },
  ],
};

const browserDependencies = [
  '@stencil/core',
  '@stencil/core/internal/client',
  '@lucide/icons',
  '@maplibre/maplibre-gl-leaflet',
  'leaflet',
  'leaflet.gridlayer.googlemutant/src/Leaflet.GoogleMutant.mjs',
  'supercluster',
  'react',
  'react-dom',
  'react-dom/client',
  '@webquark/react',
];

// Keep browser servers on IPv4 loopback; the default IPv6 port can be blocked on Windows.
const browserApi = { host: '127.0.0.1', port: 4179 };

export default defineVitestConfig({
  stencilConfig: './packages/browser/components/stencil.config.ts',
  oxc: false,
  test: {
    browser: { api: browserApi },
    projects: [
      {
        test: {
          name: 'tooling',
          attachmentsDir: 'node_modules/.cache/vitest/attachments',
          include: [
            'scripts/**/*.unit.test.ts',
            'src/tooling/**/*.unit.test.ts',
            'src/browser/theme/test/presets.unit.test.ts',
            'packages/browser/angular/scripts/**/*.unit.test.ts',
            'packages/browser/components/test/**/*.unit.test.ts',
          ],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'unit',
          attachmentsDir: 'node_modules/.cache/vitest/attachments',
          include: ['src/browser/**/*.unit.test.{ts,tsx}', 'src/browser/**/*.spec.{ts,tsx}'],
          exclude: ['src/browser/theme/test/presets.unit.test.ts'],
          environment: 'stencil',
        },
      },
      {
        plugins: [stencilVitestPlugin()],
        resolve: browserResolve,
        optimizeDeps: { include: browserDependencies },
        test: {
          name: 'carousel-browsers',
          // Start timing-sensitive browser tests after the tooling and unit projects.
          sequence: { groupOrder: 1 },
          attachmentsDir: 'node_modules/.cache/vitest/attachments',
          include: ['src/browser/components/content/carousel/test/transitions.cmp.test.ts'],
          browser: {
            api: browserApi,
            enabled: true, commands: formSubmitCommands,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }],
          },
        },
      },
      {
        plugins: [stencilVitestPlugin()],
        resolve: browserResolve,
        optimizeDeps: {
          include: browserDependencies,
        },
        test: {
          name: 'browser',
          sequence: { groupOrder: 1 },
          attachmentsDir: 'node_modules/.cache/vitest/attachments',
          include: ['src/**/*.cmp.test.{ts,tsx}'],
          browser: {
            api: browserApi,
            enabled: true, commands: formSubmitCommands,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
