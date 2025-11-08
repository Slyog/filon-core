import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve("playwright-report");
fs.mkdirSync(outputDir, { recursive: true });
const outputFile = path.join(outputDir, "results.json");

const extraArgs = process.argv.slice(2);

const isWindows = process.platform === "win32";
const cliPath = path.join(
  "node_modules",
  ".bin",
  isWindows ? "playwright.cmd" : "playwright"
);

const spawnCommand = isWindows ? "cmd.exe" : cliPath;
const spawnArgs = isWindows
  ? ["/c", `"${cliPath}"`, "test", "--reporter=json", ...extraArgs]
  : ["test", "--reporter=json", ...extraArgs];

const child = spawn(spawnCommand, spawnArgs, {
  stdio: ["inherit", "pipe", "inherit"],
  shell: false,
});

const chunks = [];
child.stdout.on("data", (data) => {
  chunks.push(data);
  process.stdout.write(data);
});

child.on("close", (code) => {
  if (chunks.length > 0) {
    fs.writeFileSync(outputFile, Buffer.concat(chunks));
  } else {
    fs.writeFileSync(outputFile, "");
  }
  process.exit(code ?? 1);
});

