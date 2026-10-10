import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const packageDirectory = resolve(import.meta.dir, '..');
const repositoryRoot = resolve(packageDirectory, '../../..');

const angularPackagesToCheck = [
  '@angular/core',
  '@angular/common',
  '@angular/forms',
  '@angular/compiler',
  '@angular/compiler-cli',
  '@angular/platform-browser',
] as const;

function cleanVersion(version: string): string {
  return version.replace(/^[\^~>=<]+/, '').trim();
}

function majorMinor(version: string): string {
  const cleaned = cleanVersion(version);
  const parts = cleaned.split('.');
  return `${parts[0]}.${parts[1] ?? '0'}`;
}

export function checkAngularDrift(inStoreFocusFrontendPath?: string): void {
  const hostPackageJsonPath =
    inStoreFocusFrontendPath ||
    process.env.INSTOREFOCUS_FRONTEND_PATH ||
    resolve(repositoryRoot, '../InStoreFocus/frontend/package.json');

  if (!existsSync(hostPackageJsonPath)) {
    console.log(
      `No local InStoreFocus repository detected at ${hostPackageJsonPath}. Skipping sibling drift check.`,
    );
    return;
  }

  const hostPackage = JSON.parse(readFileSync(hostPackageJsonPath, 'utf8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const webquarkPackage = JSON.parse(
    readFileSync(resolve(packageDirectory, 'package.json'), 'utf8'),
  ) as {
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  };

  const hostDependencies = {
    ...hostPackage.devDependencies,
    ...hostPackage.dependencies,
  };

  // Published packages use the consumer's Angular peers, not this checkout's
  // build dependencies. Their compatibility is checked by the packed consumers.
  const wrapperDependency = hostDependencies['@webquark/angular'];
  if (!wrapperDependency || !/^(file:|link:|workspace:)/.test(wrapperDependency)) {
    console.log('InStoreFocus does not locally link @webquark/angular. Skipping sibling drift check.');
    return;
  }

  const webquarkDevDependencies = webquarkPackage.devDependencies || {};

  const driftedPackages: Array<{
    name: string;
    hostVersion: string;
    webquarkDevVersion: string;
  }> = [];

  for (const pkg of angularPackagesToCheck) {
    const hostVersion = hostDependencies[pkg];
    const webquarkDevVersion = webquarkDevDependencies[pkg];

    if (hostVersion && webquarkDevVersion) {
      if (majorMinor(hostVersion) !== majorMinor(webquarkDevVersion)) {
        driftedPackages.push({
          name: pkg,
          hostVersion,
          webquarkDevVersion,
        });
      }
    }
  }

  if (driftedPackages.length > 0) {
    const coreHost = hostDependencies['@angular/core'] || 'unknown';
    const coreWebquark = webquarkDevDependencies['@angular/core'] || 'unknown';

    const driftDetails = driftedPackages
      .map(
        d => `  - ${d.name}: host has ${d.hostVersion}, WebQuark dev has ${d.webquarkDevVersion}`,
      )
      .join('\n');

    const errorMessage = [
      '========================================================================',
      'ERROR: Angular version drift detected between host and WebQuark!',
      '========================================================================',
      '',
      `InStoreFocus frontend:`,
      `@angular/core ${coreHost}`,
      '',
      `WebQuark Angular development environment:`,
      `@angular/core ${coreWebquark}`,
      '',
      `Drifted packages:`,
      driftDetails,
      '',
      `A locally linked @webquark/angular package with a different Angular`,
      `runtime version can cause Bun/esbuild to install and bundle a second`,
      `Angular runtime, resulting in injection-context failures such as NG0203.`,
      '',
      `Align the WebQuark Angular devDependencies with the host application.`,
      '========================================================================',
    ].join('\n');

    throw new Error(errorMessage);
  }

  // Also check InStoreFocus lockfile if present for nested Angular resolutions
  const hostLockfilePath = resolve(hostPackageJsonPath, '../../bun.lock');
  if (existsSync(hostLockfilePath)) {
    const lockfileContent = readFileSync(hostLockfilePath, 'utf8');
    const nestedPattern = /@instorefocus\/frontend\/@webquark\/angular\/@angular\/core/g;
    if (nestedPattern.test(lockfileContent)) {
      console.warn(
        `[WARNING] InStoreFocus bun.lock contains a nested @angular/core resolution under @webquark/angular. ` +
          `Run 'bun update @webquark/angular' or 'bun install' in InStoreFocus to eliminate nested runtime copies.`,
      );
    }
  }

  const hostCore = hostDependencies['@angular/core'] || 'unknown';
  const webquarkCore = webquarkDevDependencies['@angular/core'] || 'unknown';

  console.log(
    `Verified Angular version alignment between WebQuark devDependencies (${webquarkCore}) ` +
      `and InStoreFocus frontend (${hostCore}).`,
  );
}

// Run when executed directly
if (import.meta.main) {
  try {
    checkAngularDrift();
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}
