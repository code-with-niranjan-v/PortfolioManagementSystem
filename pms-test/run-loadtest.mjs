import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const k6Launcher = path.join(
  scriptDirectory,
  "node_modules",
  "k6-node",
  "dist",
  "cli.js",
);

console.log("Starting k6 load test. The first run may download the k6 executable.");
console.log("The test results will appear below when the run completes.\n");

const child = spawn(
  process.execPath,
  [k6Launcher, "run", path.join(scriptDirectory, "loadtest.js"), ...process.argv.slice(2)],
  { stdio: "inherit", env: process.env },
);

child.on("error", (error) => {
  console.error(`Could not start k6: ${error.message}`);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`k6 stopped after signal ${signal}.`);
    process.exitCode = 1;
    return;
  }
  process.exitCode = code ?? 1;
});
