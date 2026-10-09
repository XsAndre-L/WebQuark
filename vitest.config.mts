import { formSubmitCommands } from './scripts/browser/form-submit-commands';
import { playwright } from '@vitest/browser-playwright';
import { defineVitestConfig } from '@stencil/vitest/config';
import { stencilVitestPlugin } from '@stencil/vitest/plugin';

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

export default defineVitestConfig({
  stencilConfig: './stencil.config.ts',
  oxc: false,
  test: {
    projects: [
      {
        test: {
          name: 'tooling',
          include: ['scripts/**/*.unit.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'unit',
          include: ['src/**/*.unit.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
          environment: 'stencil',
        },
      },
      {
        plugins: [stencilVitestPlugin()],
        optimizeDeps: { include: browserDependencies },
        test: {
          name: 'carousel-browsers',
          include: ['src/components/content/carousel/test/transitions.cmp.test.ts'],
          browser: {
            enabled: true, commands: formSubmitCommands,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }],
          },
        },
      },
      {
        plugins: [stencilVitestPlugin()],
        optimizeDeps: {
          include: browserDependencies,
        },
        test: {
          name: 'browser',
          include: ['src/**/*.cmp.test.{ts,tsx}'],
          browser: {
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
