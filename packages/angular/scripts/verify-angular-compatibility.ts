import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';

type CompatibilityTarget = {
  name: string;
  angular: string;
  typescript: string;
};

type CommandResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

const packageDirectory = resolve(import.meta.dir, '..');
const repositoryRoot = resolve(packageDirectory, '../..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nodeCommand = process.env.WEBQUARK_COMPAT_NODE || 'node';
const targets: CompatibilityTarget[] = [
  {
    name: 'angular-21',
    angular: '21.2.20',
    typescript: '5.9.3',
  },
  {
    name: 'angular-22',
    angular: '22.0.7',
    typescript: '6.0.3',
  },
];

function capture(command: string[], cwd: string): CommandResult {
  const result = Bun.spawnSync({
    cmd: command,
    cwd,
    stdin: 'ignore',
    stdout: 'pipe',
    stderr: 'pipe',
    env: process.env,
  });
  const decoder = new TextDecoder();

  return {
    exitCode: result.exitCode,
    stdout: decoder.decode(result.stdout).trim(),
    stderr: decoder.decode(result.stderr).trim(),
  };
}

function run(command: string[], cwd: string): void {
  const result = capture(command, cwd);
  if (result.exitCode !== 0) {
    throw new Error(
      `Command failed in ${cwd}:\n` +
        `> ${command.join(' ')}\n` +
        `${result.stdout}\n${result.stderr}`.trim(),
    );
  }
}

function parseNodeVersion(value: string): [number, number, number] {
  const match = value.trim().match(/^v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    throw new Error(`Could not parse Node.js version: ${value}`);
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function supportsAngular22([major, minor, patch]: [number, number, number]): boolean {
  if (major === 22) {
    return minor > 22 || (minor === 22 && patch >= 3);
  }
  if (major === 24) {
    return minor > 15 || (minor === 15 && patch >= 0);
  }
  return major === 26;
}

function verifyNodeVersion(): void {
  const result = capture([nodeCommand, '--version'], repositoryRoot);
  if (result.exitCode !== 0) {
    throw new Error(
      `Could not run the compatibility Node.js executable "${nodeCommand}":\n${result.stderr}`,
    );
  }

  if (!supportsAngular22(parseNodeVersion(result.stdout))) {
    throw new Error(
      `Angular 22 compatibility verification requires Node.js ` +
        `^22.22.3, ^24.15.0, or ^26.0.0; received ${result.stdout}. ` +
        `Use Node.js 24.15.0 or set WEBQUARK_COMPAT_NODE to a compatible executable.`,
    );
  }
}

function packageManifest(directory: string): { name: string; version: string } {
  return JSON.parse(
    readFileSync(resolve(directory, 'package.json'), 'utf8'),
  ) as { name: string; version: string };
}

function pack(directory: string, tarballDirectory: string): string {
  const result = capture(
    [npmCommand, 'pack', '--json', '--pack-destination', tarballDirectory],
    directory,
  );
  if (result.exitCode !== 0) {
    throw new Error(`Could not pack ${directory}:\n${result.stdout}\n${result.stderr}`);
  }

  const summaries = JSON.parse(result.stdout) as Array<{ filename: string }>;
  const summary = summaries[0];
  if (!summary) {
    throw new Error(`npm pack returned no package summary for ${directory}`);
  }

  return resolve(tarballDirectory, summary.filename);
}

function fileDependency(fromDirectory: string, tarball: string): string {
  return `file:${relative(fromDirectory, tarball).replaceAll('\\', '/')}`;
}

function writeConsumer(
  target: CompatibilityTarget,
  consumerDirectory: string,
  coreTarball: string,
  angularTarball: string,
): void {
  const manifest = {
    name: `@webquark/${target.name}-compatibility`,
    version: '0.0.0',
    private: true,
    type: 'module',
    dependencies: {
      '@angular/common': target.angular,
      '@angular/compiler': target.angular,
      '@angular/compiler-cli': target.angular,
      '@angular/core': target.angular,
      '@angular/forms': target.angular,
      '@angular/platform-browser': target.angular,
      '@webquark/angular': fileDependency(consumerDirectory, angularTarball),
      '@webquark/core': fileDependency(consumerDirectory, coreTarball),
      rxjs: '7.8.2',
      tslib: '2.8.1',
      typescript: target.typescript,
      'zone.js': '0.15.1',
    },
  };
  const tsconfig = {
    compilerOptions: {
      target: 'es2022',
      module: 'esnext',
      lib: ['dom', 'es2022'],
      strict: true,
      skipLibCheck: true,
      moduleResolution: 'bundler',
      rootDir: '.',
      noEmit: true,
      types: [],
    },
    angularCompilerOptions: {
      strictTemplates: true,
    },
    files: ['./packed-consumer.ts'],
  };

  writeFileSync(
    resolve(consumerDirectory, 'package.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  writeFileSync(
    resolve(consumerDirectory, 'tsconfig.json'),
    `${JSON.stringify(tsconfig, null, 2)}\n`,
  );
  copyFileSync(
    resolve(packageDirectory, 'consumer-tests/packed-consumer.ts'),
    resolve(consumerDirectory, 'packed-consumer.ts'),
  );
}

function verifyInstalledPackages(
  target: CompatibilityTarget,
  consumerDirectory: string,
): void {
  const installedAngular = packageManifest(
    resolve(consumerDirectory, 'node_modules/@angular/core'),
  );
  if (installedAngular.version !== target.angular) {
    throw new Error(
      `${target.name} installed @angular/core@${installedAngular.version}; ` +
        `expected ${target.angular}`,
    );
  }

  const nestedCore = resolve(
    consumerDirectory,
    'node_modules/@webquark/angular/node_modules/@webquark/core',
  );
  if (existsSync(nestedCore)) {
    throw new Error(`${target.name} installed a nested @webquark/core package`);
  }
}

function verifyTarget(
  target: CompatibilityTarget,
  compatibilityRoot: string,
  coreTarball: string,
  angularTarball: string,
): void {
  const consumerDirectory = resolve(compatibilityRoot, target.name);
  mkdirSync(consumerDirectory);
  writeConsumer(target, consumerDirectory, coreTarball, angularTarball);

  run(
    [
      npmCommand,
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--package-lock=false',
      '--strict-peer-deps',
    ],
    consumerDirectory,
  );
  verifyInstalledPackages(target, consumerDirectory);
  run(
    [
      nodeCommand,
      resolve(
        consumerDirectory,
        'node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js',
      ),
      '-p',
      'tsconfig.json',
    ],
    consumerDirectory,
  );

  console.log(
    `Verified packed @webquark/angular with Angular ${target.angular} ` +
      `and TypeScript ${target.typescript}.`,
  );
}

verifyNodeVersion();

const compatibilityRoot = mkdtempSync(
  join(tmpdir(), 'webquark-angular-compatibility-'),
);
const expectedTemporaryPrefix = resolve(
  tmpdir(),
  'webquark-angular-compatibility-',
);

try {
  const tarballDirectory = resolve(compatibilityRoot, 'tarballs');
  mkdirSync(tarballDirectory);
  const coreTarball = pack(repositoryRoot, tarballDirectory);
  const angularTarball = pack(packageDirectory, tarballDirectory);

  for (const target of targets) {
    verifyTarget(target, compatibilityRoot, coreTarball, angularTarball);
  }
} finally {
  const resolvedCompatibilityRoot = resolve(compatibilityRoot);
  if (!resolvedCompatibilityRoot.startsWith(expectedTemporaryPrefix)) {
    throw new Error(
      `Refusing to clean unexpected compatibility directory: ${resolvedCompatibilityRoot}`,
    );
  }
  rmSync(resolvedCompatibilityRoot, { recursive: true, force: true });
}
