const { spawn } = require("child_process");

const child = spawn("npm", ["run", "dev"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
});

const TIMEOUT_MS = 120_000;
const timer = setTimeout(() => {
  console.log(
    "\n⏱️ dev timeout reached, continuing without blocking Cursor..."
  );
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", child.pid, "/f", "/t"]);
  } else {
    child.kill("SIGTERM");
  }
}, TIMEOUT_MS);

child.on("close", (code) => {
  clearTimeout(timer);
  process.exit(code ?? 0);
});
