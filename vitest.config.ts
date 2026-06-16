import { defineVitestConfig } from '@stencil/vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineVitestConfig({
  stencilConfig: './stencil.config.ts',
  test: {
    oxc: false,
    projects: [
      // Unit tests - stencil environment for component logic
      {
        test: {
          name: 'unit',
          oxc: false,
          include: ['src/**/*.unit.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
          environment: 'stencil',
        },
      },
      // Component browser tests - real browser via Playwright
      {
        test: {
          name: 'browser',
          include: ['src/**/*.cmp.test.{ts,tsx}'],
          setupFiles: ['./vitest-setup.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
