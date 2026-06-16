/**
 * @fileoverview Concurrently runs Stencil's dev server and Bun's playground compiler.
 * Pipes all output and handles clean process termination on Windows and Unix.
 */

import { spawn } from "bun";
import * as path from "path";

const isWindows = process.platform === "win32";

// Use the local Stencil binary directly for maximum reliability, resolved absolutely
const stencilBinary = path.resolve(
  process.cwd(), 
  isWindows ? "node_modules\\.bin\\stencil.exe" : "node_modules/.bin/stencil"
);
const stencilCmd = [stencilBinary, "build", "--dev", "--watch", "--serve"];

const bunCmd = [
  "bun", 
  "build", 
  "src/playground/playground.ts", 
  "--outfile=src/playground/playground.bundled.js", 
  "--watch", 
  "--loader", 
  ".html:text", 
  "--loader", 
  ".css:text"
];

console.log("🚀 Starting Stencil watch/serve compiler...");
const stencilProcess = Bun.spawn(stencilCmd, {
  stdout: "inherit",
  stderr: "inherit",
});

console.log("🚀 Starting Bun playground watch bundler...");
const bunProcess = Bun.spawn(bunCmd, {
  stdout: "inherit",
  stderr: "inherit",
});

let isShuttingDown = false;

function cleanup() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log("\n🛑 Shutting down playground dev servers...");
  try {
    stencilProcess.kill();
  } catch (e) {}
  try {
    bunProcess.kill();
  } catch (e) {}
  process.exit(0);
}

// Handle termination signals
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

// Watch for premature child exit
Promise.all([
  stencilProcess.exited,
  bunProcess.exited
]).then(() => {
  cleanup();
});
