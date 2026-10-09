import { globSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('icon dependency boundaries', () => {
  it('pins the icon data dependency and uses tree-shakable named imports', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
      dependencies?: Record<string, string>;
    };
    const sourceFiles = globSync('src/**/*.{ts,tsx}', {
      exclude: ['src/**/*.d.ts', 'src/**/*.test.*', 'src/**/*.spec.*'],
    });
    const source = sourceFiles.map(file => readFileSync(file, 'utf8')).join('\n');
    const runtimeImports = Array.from(source.matchAll(/from\s+['"](@lucide\/icons[^'"]*)['"]/g))
      .map(match => match[1]);

    expect(packageJson.dependencies?.['@lucide/icons']).toBe('1.54.0');
    expect(runtimeImports.length).toBeGreaterThan(0);
    expect(runtimeImports.every(specifier => specifier === '@lucide/icons')).toBe(true);
    expect(source).not.toMatch(/import\s+\*\s+as\s+\w+\s+from\s+['"]@lucide\/icons/);
    expect(source).not.toMatch(/from\s+['"]@lucide\/icons\/dynamic['"]/);
  });
});
