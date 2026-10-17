import { spawn } from 'node:child_process';

/** Compiles the WebQuark monorepo by invoking bun packages:build in the source directory. */
export async function compile(source: string): Promise<void> {
  console.log(`Building core, browser, tooling, React, and Angular in ${source}`);
  await new Promise<void>((resolve, reject) => {
    const child = spawn('bun', ['run', 'packages:build'], { cwd: source, stdio: 'inherit', shell: false });
    child.on('error', reject);
    child.on('exit', (code, signal) => (code === 0 ? resolve() : reject(new Error(`WebQuark build failed (${signal ?? code}). Active packages were not changed.`))));
  });
}
