import { execSync } from "child_process";
import * as path from "path";

const target = process.argv[2] || "all";
const rootDir = path.resolve(import.meta.dirname || eval("__dirname"), "..");
const reactDir = path.resolve(rootDir, "packages", "react");

if (!process.argv[2]) {
  console.log("⚠️ No publish target specified. Defaulting to 'all' (core & react packages).\n");
}

try {
  if (target === "core") {
    console.log("Building core components...");
    execSync("bun run build", { stdio: "inherit", cwd: rootDir });
    console.log("Publishing @webquark/core to npm...");
    execSync("npm publish --access public", { stdio: "inherit", cwd: rootDir });
  } else if (target === "react") {
    console.log("Building core components...");
    execSync("bun run build", { stdio: "inherit", cwd: rootDir });
    console.log("Building react wrapper package...");
    execSync("bun run build", { stdio: "inherit", cwd: reactDir });
    console.log("Publishing @webquark/react to npm...");
    execSync("npm publish --access public", { stdio: "inherit", cwd: reactDir });
  } else if (target === "all") {
    console.log("Building core components...");
    execSync("bun run build", { stdio: "inherit", cwd: rootDir });
    console.log("Publishing @webquark/core to npm...");
    execSync("npm publish --access public", { stdio: "inherit", cwd: rootDir });

    console.log("Building react wrapper package...");
    execSync("bun run build", { stdio: "inherit", cwd: reactDir });
    console.log("Publishing @webquark/react to npm...");
    execSync("npm publish --access public", { stdio: "inherit", cwd: reactDir });
  } else {
    console.error(`Unknown target: ${target}. Supported targets are 'core', 'react', 'all'.`);
    process.exit(1);
  }
  console.log("\nPublishing completed successfully!");
} catch (error: any) {
  console.error("\nPublishing failed:", error.message || error);
  process.exit(1);
}
